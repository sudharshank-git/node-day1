const fs = require("fs")
const path = require("path")



const args = process.argv.slice(2)
const jsonFile = args[0]
const operation = args[1]
const fieldRecord = args.slice(2)
console.log(args)
console.log(jsonFile)
console.log(operation)
console.log(fieldRecord)

const parseFieldData = (pairs)=>{
    const updates ={}
    for(const pair of pairs){
        const eqIndex = pair.indexOf("=");
        if(eqIndex === -1){
            console.error("Invalid Arguments Passed Enter a valid Argument")
            process.exit(1);
        }
        const key = pair.slice(0,eqIndex).trim();
        let value = pair.slice(eqIndex+1).trim();
        console.log("Index Of :",eqIndex)
        console.log("Key is :",key)
        console.log("Value is :" ,value)
        if(value === "true") value = true;
        else if (value === "false") value = false;
        else if (!isNaN(value) && value !== "") value = Number(value);
        updates[key] = value;
    }
    return updates
}
const updates = parseFieldData(fieldRecord)
console.log(updates)

let record;
try{
    const raw_record = fs.readFileSync("hello.json",'utf-8')
    record = JSON.parse(raw_record)
}catch(err){
    console.error("Unable to fetch the raw data from json file")
    process.exit(1);
}

const changes =[];
for([key,newVal] of Object.entries(updates)){
    if(operation === "--update"){
        if(record[key]){
            const oldVal = record[key];
            if(oldVal === newVal){
                console.log("The value already exist")
                changes.push({ Action : "Exist" ,field : key, oldValue :oldVal})
            }else{
                record[key] = newVal;
                changes.push({ Action : "Update" ,field : key, oldValue :oldVal , newValue : newVal})
            }
        }else{
            record[key] = newVal;
            changes.push({ Action : "Add" ,field : key , newValue : newVal})
        }
    }else if(operation === "--append"){
        if(record[key]){
            const oldVal = record[key];
            if(oldVal === newVal){
                console.log("The value already exist")
                changes.push({ Action : "Exist" ,field : key, oldValue :oldVal})
            }else{
                record[key] = newVal;
                changes.push({ Action : "Update" ,field : key, oldValue :oldVal , newValue : newVal})
            }
        }else if(!record[key]){
            const oldVal = record[key];
            record[key] = newVal;
            changes.push({ Action : "Add" ,field : key, oldValue :oldVal , newValue : newVal})
        }
    }else if(operation === "--delete"){
        console.log("console:" ,record[key])
        if(record[key] === updates[key]){
            const oldVal = record[key]
            delete record[key]
            changes.push({ Action : "Delete" ,field : key, Value :oldVal})
        }else if (record[key] !== updates[key]){
            console.log("Record Values Does Not Match\n")
        }else{
            console.log("No record Found In the field Name")
        }
    }
    console.log(changes)
    console.log(record)
    console.log("\n\n")
}


fs.writeFileSync("hello.json",JSON.stringify(record,null,5),'utf-8');


const logFilePath = path.join(path.dirname(jsonFile), "LogData.log");
const timeStamp = new Date().toISOString();
const logLines = changes.map(c=>
    `[${timeStamp}] ${c.Action} -> ${c.field}: ${JSON.stringify(c.oldValue)} -> ${c.Action === "Exist" ? "OldValue":JSON.stringify(c.newValue)} `
)
const logEntry = logLines.join('\n')+"\n";
fs.appendFileSync(logFilePath,logEntry,'utf-8')
console.log(logLines)