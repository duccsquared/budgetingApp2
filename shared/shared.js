const KEY_USER = "keyCurrentUser"

// class representing an object that has a corresponding entry in the SQL database
class DatabaseObj {
    // runs an SQL command
    // sql: an SQL command (eg: SELECT * FROM student WHERE mark > 80)
    static runSQL(sql) {
        // format the SQL query to work correctly
        let query = 'sql=' + encodeURIComponent(sql);
        // select which php file to use (one file for SELECT commands, another file for everything else)
        let fileName = null;
        if(sql.substring(0,6)==="SELECT") {fileName = "../../php/retrieve_data.php"}
        else {fileName = "../../php/modify_data.php"}
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
    insert(objList,ignoreList=[]) {
        let sql = `INSERT INTO ${this._tableName}(${this.attributesToKeys(ignoreList)}) VALUES(${this.attributesToValues(ignoreList)})`;
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
    attributesToKeys(ignoreList) {
        let attrList = Object.keys(this._attributes);
        for(let ignoreAttr of ignoreList) {
            attrList.splice(attrList.indexOf(ignoreAttr),1);
        }
        return attrList
    }
    // get attributes formatted for an SQL statement
    attributesToValues(ignoreList) {
        let keyList = Object.keys(this._attributes);
        let valueList = []
        for(let item of keyList) {
            if(ignoreList.indexOf(item) < 0) { // if the item shouldn't be ignored
                valueList.push(this.format(this._attributes[item]))
            }
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
    constructor(userID,userName,userPassword,insertIntoDatabase=true) {
        super("user",{"user_id" : userID,"user_name" : userName, "user_password" : userPassword},["user_id"],User.objList,insertIntoDatabase)
    }

    get id() {return this._attributes["user_id"]}
    get name() {return this._attributes["user_name"]}
    get password() {return this._attributes["user_password"]}

    set id(_userID) {this.update("user_id",_userID)}
    set name(_userName) {this.update("user_name",_userName)}
    set password(_userPassword) {this.update("user_password",_userPassword)}

    insert(ignoreList=[]) {return super.insert(User.objList,ignoreList)}
    delete() {return super.delete(User.objList)}


    static fromJson(data) {
        return new User(Number(data["user_id"]),data["user_name"],data["user_password"],false)
    }

    static selectAll() {
        User.objList = []
        return DatabaseObj.selectAll("user",(data)=>User.fromJson(data));
    }

    static findUserByName(name) {
        for(let user of User.objList) {
            if(user.name==name) {
                return user
            }
        }
        return null;
    }
}

class Account extends DatabaseObj {
    static objList = [];
    constructor(accID,userID,accName,accStartAmount,insertIntoDatabase=true) {
        super("user",{"acc_id" : accID,"user_id" : userID, "acc_name" : accName, "acc_start_amount" : accStartAmount},["acc_id","user_id"],Account.objList,insertIntoDatabase)
    }

    get accID() {return this._attributes["acc_id"]}
    get userID() {return this._attributes["user_id"]}
    get accName() {return this._attributes["acc_name"]}
    get accStartAmount() {return this._attributes["acc_start_amount"]}

    set accID(_accID) {this.update("acc_id",_accID)}
    set userID(_userID) {this.update("user_id",_userID)}
    set accName(_accName) {this.update("acc_name",_accName)}
    set accStartAmount(_accStartAmount) {this.update("acc_start_amount",_accStartAmount)}

    insert() {return super.insert(Account.objList)}
    delete() {return super.delete(Account.objList)}


    static fromJson(data) {
        return new Account(Number(data["acc_id"]),Number(data["user_id"]),data["acc_name"],Number(data["acc_start_amount"]),false)
    }

    static selectAll() {
        User.objList = []
        return DatabaseObj.selectAll("user",(data)=>User.fromJson(data));
    }
}
