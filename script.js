// Prequirements modules
const fs = require("fs")
const path = require("path")


// getting CLI records
const args = process.argv.slice(2)
const jsonFile = args[0]
const operation = args[1]
const fieldRecord = args.slice(2)


// Proper Validating Each Record
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

        // Validate the String To Other Types
        if(value === "true") value = true;
        else if (value === "false") value = false;
        else if (!isNaN(value) && value !== "") value = Number(value);

        // Add to the updates of each field
        updates[key] = value;
    }
    return updates
}
const updates = parseFieldData(fieldRecord)



// get record that is to be manipulated
let record;
let findRecord;
if(operation !== "--add"){
    try{
        const raw_record = fs.readFileSync(jsonFile,'utf-8')
        record = JSON.parse(raw_record)
        findRecord = record.find(res => res.id === updates.id)
        if(!findRecord){
            throw new Error("Enter the valid record id To Manipulate")
        }

    }catch(err){
        console.error("Unable to fetch the raw data from json file" , err.message)
        process.exit(1);
    }
}else{
    try{
        const raw_record = fs.readFileSync(jsonFile,'utf-8')
        record = JSON.parse(raw_record)
        console.log(record)
    }catch(err){
        console.error("Unable to fetch the raw data from json file")
        process.exit(1);
    }
}


// Generate unique Id For new record 
let maxId = record.reduce(
    (max, item) => Math.max(max, item.id),
    0
);


// Record the changes made by comparing records and updates
const changes =[];
for([key,newVal] of Object.entries(updates)){
    // if wanted to update exsisting record
    if(operation === "--update"){
        // check if field is already exist
        if(findRecord[key]){
            const oldVal = findRecord[key];
            // check if old and new value are same
            if(oldVal === newVal){
                console.log("The value already exist")
                changes.push({ Action : "Exist" ,id : updates.id,field : key, oldValue :oldVal})
            }else{
                findRecord[key] = newVal;
                changes.push({ Action : "Update" ,id : updates.id,field : key, oldValue :oldVal , newValue : newVal})
            }
            // if field is not available in record 
        }else{
            findRecord[key] = newVal;
            changes.push({ Action : "Add" ,id : updates.id,field : key , newValue : newVal})
        }
        // if needed to add fields to exsiting record
    }else if(operation === "--append"){
        // check if field is already exist
        if(findRecord[key]){
            const oldVal = findRecord[key];
            // check if old and new value are same
            if(oldVal === newVal){
                console.log("The value already exist")
                changes.push({ Action : "Exist" ,id : updates.id,field : key, oldValue :oldVal})
            }else{
                findRecord[key] = newVal;
                changes.push({ Action : "Update" ,id : updates.id,field : key, oldValue :oldVal , newValue : newVal})
            }
            // Add field data if not present in the record
        }else if(!findRecord[key]){
            const oldVal = findRecord[key];
            findRecord[key] = newVal;
            changes.push({ Action : "Add" ,id : updates.id,field : key, oldValue :oldVal , newValue : newVal})
        }
    }else if(operation === "--delete"){
        // delete the field from record if value are same
        if(findRecord[key] === updates[key]){
            const oldVal = findRecord[key]
            delete findRecord[key]
            changes.push({ Action : "Delete" ,id : updates.id,field : key, Value :oldVal})
        }else if (findRecord[key] !== updates[key]){
            console.log("Record Values Does Not Match\n")
        }else{
            console.log("No record Found In the field Name")
        }
        // add new record to available record with unique id
    }else if(operation === "--add"){
        // check if the id exists and then add data
        const isPresent = record.find(f => f.id === updates.id)
        if (!isPresent){
            const new_record ={
            id: updates.id || maxId+1,
            ...updates
            }
            changes.push({ Action : "New Record" , Data : new_record})
            record.push(new_record)
        }else{
            console.log("already the data Exist use --append/--update to updated record")
            return;
        }
    }
}

// replace the json record file with updated record
fs.writeFileSync(jsonFile,JSON.stringify(record,null,2),'utf-8');


// create a log files and save the update records
const logFilePath = path.join(path.dirname(jsonFile), "UpdatesLogs.log");
const timeStamp = new Date().toISOString();
let logLines;
if(operation === "--add"){
    logLines = changes.map(c=>
        `[${timeStamp}] ${c.Action} -> id:${c.Data.id}  name:${c.Data.name} value:${c.Data.value} work:${c.Data.work} mark:${c.Data.mark} active:${c.Data.active} role:${c.Data.role} city:${c.Data.city}`
    )
}else{
    logLines = changes.map(c=>
        `[${timeStamp}] ${c.Action} -> For Id: ${c.id} = ${c.field}: ${JSON.stringify(c.oldValue)} -> ${c.Action === "Exist" ? "OldValue":JSON.stringify(c.newValue)} `
    )
}
const logEntry = logLines.join('\n')+"\n";

// append the log datas to exsisting log files
fs.appendFileSync(logFilePath,logEntry,'utf-8')
console.log(logLines)