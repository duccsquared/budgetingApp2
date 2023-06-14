// class representing an object that has a corresponding entry in the SQL database
class DatabaseObj {
    // runs an SQL command
    // sql: an SQL command (eg: SELECT * FROM student WHERE mark > 80)
    static runSQL(sql) {
        // format the SQL query to work correctly
        let query = 'sql=' + encodeURIComponent(sql);
        // select which php file to use (one file for SELECT commands, another file for everything else)
        let fileName = null;
        if(sql.substring(0,6)==="SELECT") {fileName = "retrieve_data.php"}
        else {fileName = "modify_data.php"}
        // construct the request parameters
        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: query,
        };
    
        // Send a fetch request to the PHP script
        return fetch(fileName, requestOptions)
            .then((response) => {
                if (response.ok) {
                    return response;
                 } else {
                    throw new Error('Request failed');
                }
            }
        );
    }
    // constructor
    // tableName: the name of the table that the object is in
    // attributes: an object with the names of each attribute and their corresponding values
    // primaryKeyList: a list of attributes that are primary keys
    // objList: a list of objects from the corresponding table
    // insertIntoDatabase: whether to run the insert SQL statement 
    constructor(tableName,attributes,primaryKeyList,objList,insertIntoDatabase=true) {
        this._tableName = tableName;
        this._attributes = attributes;
        this._primaryKeyList = primaryKeyList;
        objList.push(this);
        if(insertIntoDatabase) {this.insert(objList)}
    }
    // insert this object into the database
    insert(objList) {
        let sql = `INSERT INTO ${this._tableName}(${this.attributesToKeys()}) VALUES(${this.attributesToValues()})`;
        console.log(sql);
        return DatabaseObj.runSQL(sql)
            .then((data)=> data.text())
            .then((text)=> {
                if(text!="success") { // delete object if inserting it failed
                    objList.splice(objList.indexOf(this),1);
                }
                return text;
            });
    }
    // delete this object from the database
    delete(objList) {
        objList.splice(objList.indexOf(this),1)
        let sql = `DELETE FROM ${this._tableName} WHERE ${this.getIdentifyingCondition()}`
        console.log(sql)
        return DatabaseObj.runSQL(sql).then((data)=>data.text());
    }
    // update an attribute within the object
    update(attribute,newValue) {
        this._attributes[attribute] = newValue;
        let sql = `UPDATE ${this._tableName} SET ${attribute} = ${this.format(newValue)} WHERE ${this.getIdentifyingCondition()}`
        console.log(sql)
        return DatabaseObj.runSQL(sql).then((data)=>data.text());
    }
    // get a string corresponding to the conditions to uniquely identify this object
    getIdentifyingCondition() {
        let resultList = []
        for(let item of this._primaryKeyList) {
            resultList.push(`${item} = ${this.format(this._attributes[item])}`)
        }
        return resultList.join(" AND ");
    }
    // get keys
    attributesToKeys() {
        return Object.keys(this._attributes);
    }
    // get attributes formatted for an SQL statement
    attributesToValues() {
        let keyList = Object.keys(this._attributes);
        let valueList = []
        for(let item of keyList) {
            valueList.push(this.format(this._attributes[item]))
        }
        return valueList;
    }
    // format a value for an SQL statement
    format(value) {
        if(typeof value ==='string' || value instanceof String) {
            return "'" + value + "'";
        }
        else {
            return value;
        }
    }
    // get all entries of a table
    static selectAll(tableName,fromJsonFunc) {
        let sql = `SELECT * FROM ${tableName}`;
        return DatabaseObj.runSQL(sql).then((data)=>data.json()).then(
            (data) => {
                console.log("data: " + data)
                let resultList = [];
                for(let subData of data) {
                    let obj = fromJsonFunc(subData)
                    resultList.push(obj);
                }
                return resultList;
            }
        )
    }
}


class User extends DatabaseObj {
    static objList = [];
    constructor(id,fname,gname,address,insertIntoDatabase=true) {
        super("test",{"id" : id,"fname" : fname, "gname" : gname, "address" : address},["id"],User.objList,insertIntoDatabase)
    }

    get id() {return this._attributes["id"]}
    get fname() {return this._attributes["fname"]}
    get gname() {return this._attributes["gname"]}
    get address() {return this._attributes["address"]}

    set id(_id) {this.update("id",_id)}
    set fname(_fname) {this.update("fname",_fname)}
    set gname(_gname) {this.update("gname",_gname)}
    set address(_address) {this.update("address",_address)}

    insert() {return super.insert(User.objList)}

    delete() {return super.delete(User.objList)}


    static fromJson(data) {
        return new User(Number(data["id"]),data["fname"],data["gname"],data["address"],false)
    }

    static selectAll() {
        User.objList = []
        return DatabaseObj.selectAll("test",(data)=>User.fromJson(data));
    }
}

function stringifyUser() {
    let result = ""
    for(let user of User.objList) {
        result += "<p>" + JSON.stringify(user) + "</p>"
    }
    return result;
}

function beepSelect() {
    User.selectAll().then(() => {
        console.log(User.objList)
        document.getElementById('result').innerHTML = stringifyUser()
    });
}

function beepInsert() {
    let u = new User(5,"Casey","Napoleon","5 Brown Street",false)
    u.insert().then((text)=>document.getElementById('result').innerHTML = text + "\n" + stringifyUser());
    // DatabaseObj.runSQL("DELETE FROM test WHERE id = 5")
}

function beepUpdate() {
    for(let user of User.objList) {
        if(user.id == 5) {
            // user.fname = "lawrence"
            user.update("fname","lawrence").then((text)=>document.getElementById('result').innerHTML = text + "\n" + stringifyUser());
            return;
        }
    }
    document.getElementById('result').innerHTML = "obj to update not found"
}

function beepDelete() {
    for(let user of User.objList) {
        if(user.id == 5) {
            user.delete().then((text)=>document.getElementById('result').innerHTML = text + "\n" + stringifyUser());
            return;
        }
    }
    document.getElementById('result').innerHTML = "obj to delete not found"
}