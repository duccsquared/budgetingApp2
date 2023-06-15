function runSQL(sql) {
    // format the SQL query to work correctly
    let query = 'sql=' + encodeURIComponent(sql);
    // select which php file to use (one file for SELECT commands, another file for everything else)
    let fileName = null;
    if(sql.substring(0,6)==="SELECT") {fileName = "../php/retrieve_data.php"}
    else {fileName = "../php/modify_data.php"}
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

const sep = "----------"

function outputToResult(text) {
    document.getElementById("result").innerHTML += "<p>" + text + "</p>";
}
function customOutput(response,sql) {
    return response.text().then((text)=>{
        outputToResult("<b>" + sql + "</b>")
        if(text==="success") {
            outputToResult("statement execution succeeded")
        }
        else {
            outputToResult(text)
        }
        outputToResult(sep)
    })
}
function outputResponse(response) {
    return response.text().then((text)=>outputToResult(text))
}

function runAndOutput(sql) {
    return runSQL(sql).then((response)=>customOutput(response,sql))
}

function createTables() {
    runAndOutput("DROP TABLE audit")
        .then(()=>runAndOutput("DROP TABLE transaction"))
        .then(()=>runAndOutput("DROP TABLE category"))
        .then(()=>runAndOutput("DROP TABLE account"))
        .then(()=>runAndOutput("DROP TABLE user"))
        .then(()=>runAndOutput(
            `
            CREATE TABLE user (
                user_id INT(8) NOT NULL AUTO_INCREMENT,
                user_name VARCHAR(50) NOT NULL,
                user_password VARCHAR(50) NOT NULL,
                PRIMARY KEY (user_id)
            )
            `
        ))
        .then(()=>runAndOutput(`ALTER TABLE user ENGINE = InnoDB;`))
        .then(()=>runAndOutput(
            `
            CREATE TABLE account (
                acc_id INT(8) NOT NULL AUTO_INCREMENT,
                acc_name VARCHAR(50) NOT NULL,
                acc_start_amount DOUBLE NOT NULL,
                user_id INT(8) NOT NULL,
                PRIMARY KEY (acc_id)
            )
            `
        ))
        .then(()=>runAndOutput(`ALTER TABLE account ENGINE = InnoDB;`))
        .then(()=>runAndOutput(`ALTER TABLE account ADD CONSTRAINT fk_user_account FOREIGN KEY ( user_id ) REFERENCES user ( user_id )`))
        .then(()=>runAndOutput(
            `
            CREATE TABLE category (
                cat_id INT(8) NOT NULL AUTO_INCREMENT,
                cat_name VARCHAR(50) NOT NULL,
                user_id INT(8) NOT NULL,
                PRIMARY KEY (cat_id)
            )
            `
        ))
        .then(()=>runAndOutput(`ALTER TABLE category ENGINE = InnoDB;`))
        .then(()=>runAndOutput(`ALTER TABLE category ADD CONSTRAINT fk_user_category FOREIGN KEY ( user_id ) REFERENCES user ( user_id )`))
        .then(()=>runAndOutput(
            `
            CREATE TABLE transaction (
                trans_id INT(8) NOT NULL AUTO_INCREMENT,
                trans_date DATE NOT NULL,
                trans_amount DOUBLE NOT NULL,
                acc_id INT(8) NOT NULL,
                cat_id INT(8) NOT NULL,
                trans_desc VARCHAR(250),
                trans_transfer_id INT(8),
                PRIMARY KEY (trans_id)
            )
            `
        ))
        .then(()=>runAndOutput(`ALTER TABLE transaction ENGINE = InnoDB;`))
        .then(()=>runAndOutput(`ALTER TABLE transaction ADD CONSTRAINT fk_account_transaction FOREIGN KEY ( acc_id ) REFERENCES account ( acc_id )`))
        .then(()=>runAndOutput(`ALTER TABLE transaction ADD CONSTRAINT fk_category_transaction FOREIGN KEY ( cat_id ) REFERENCES category ( cat_id )`))
        .then(()=>runAndOutput(`ALTER TABLE transaction ADD CONSTRAINT fk_transaction_transaction FOREIGN KEY ( trans_transfer_id ) REFERENCES transaction ( trans_id )`))
        .then(()=>runAndOutput(
            `
            CREATE TABLE audit (
                audit_id INT(8) NOT NULL AUTO_INCREMENT,
                audit_date DATE NOT NULL,
                audit_amount DOUBLE NOT NULL,
                acc_id INT(8) NOT NULL,
                PRIMARY KEY (audit_id)
            )
            `
        ))
        .then(()=>runAndOutput(`ALTER TABLE audit ENGINE = InnoDB;`))
        .then(()=>runAndOutput(`ALTER TABLE audit ADD CONSTRAINT fk_account_audit FOREIGN KEY ( acc_id ) REFERENCES account ( acc_id )`))
}


createTables();
