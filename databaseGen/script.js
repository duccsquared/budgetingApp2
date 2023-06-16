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
                user_id INT(8) NOT NULL,
                acc_name VARCHAR(50) NOT NULL,
                acc_start_amount DOUBLE NOT NULL,
                PRIMARY KEY (acc_id, user_id)
            )
            `
        ))
        .then(()=>runAndOutput(`ALTER TABLE account ENGINE = InnoDB;`))
        .then(()=>runAndOutput(`ALTER TABLE account ADD CONSTRAINT fk_user_account FOREIGN KEY ( user_id ) REFERENCES user ( user_id )`))
        .then(()=>runAndOutput(
            `
            CREATE TABLE category (
                cat_id INT(8) NOT NULL AUTO_INCREMENT,
                user_id INT(8) NOT NULL,
                cat_name VARCHAR(50) NOT NULL,
                PRIMARY KEY (cat_id, user_id)
            )
            `
        ))
        .then(()=>runAndOutput(`ALTER TABLE category ENGINE = InnoDB;`))
        .then(()=>runAndOutput(`ALTER TABLE category ADD CONSTRAINT fk_user_category FOREIGN KEY ( user_id ) REFERENCES user ( user_id )`))
        .then(()=>runAndOutput(
            `
            CREATE TABLE transaction (
                trans_id INT(8) NOT NULL AUTO_INCREMENT,
                user_id INT(8) NOT NULL,
                trans_date DATE NOT NULL,
                trans_amount DOUBLE NOT NULL,
                acc_id INT(8) NOT NULL,
                cat_id INT(8) NOT NULL,
                trans_desc VARCHAR(250),
                trans_transfer_id INT(8),
                PRIMARY KEY (trans_id, user_id)
            )
            `
        ))
        .then(()=>runAndOutput(`ALTER TABLE transaction ENGINE = InnoDB;`))
        .then(()=>runAndOutput(`ALTER TABLE transaction ADD CONSTRAINT fk_user_transaction FOREIGN KEY ( user_id ) REFERENCES user ( user_id )`))
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

function deleteAllData() {
    return runAndOutput(`DELETE FROM audit`)
    .then(()=>runAndOutput(`DELETE FROM transaction`))
    .then(()=>runAndOutput(`DELETE FROM category`))
    .then(()=>runAndOutput(`DELETE FROM account`))
    .then(()=>runAndOutput(`DELETE FROM user`))
}

function insertSampleData() {
    // insert users
    runAndOutput(`INSERT INTO user (user_id, user_name, user_password) VALUES 
        (1,'Jacob123','password'),
        (2,'RedGoose','123456')
    `)
    // insert accounts
    .then(()=>runAndOutput(`INSERT INTO account (acc_id, user_id, acc_name, acc_start_amount) VALUES 
        (1, 1, 'cash', 100),
        (2, 1, 'bank', 2000),
        (3, 1, '401k', 5000),
        (4, 1, 'transport card', 50),
        
        (1, 2, 'cash', 150),
        (2, 2, 'bank', 12000),
        (3, 2, 'gas station card', 100)
    `))
    // insert categories
    .then(()=>runAndOutput(`INSERT INTO category (cat_id, user_id, cat_name) VALUES 
        (1, 1, 'food'),
        (2, 1, 'transport'),
        (3, 1, 'shopping'),
        (4, 1, 'income'),
        (5, 1, 'misc'),
        
        (1, 2, 'groceries'),
        (2, 2, 'vehicles'),
        (3, 2, 'miscellaneous')
    `))
    // insert transactions
    .then(()=>runAndOutput(`INSERT INTO transaction (trans_id, user_id, trans_date, trans_amount, acc_id, cat_id, trans_desc, trans_transfer_id) VALUES 
        (1, 1, STR_TO_DATE('2023-05-01', '%Y-%m-%d'), -10,1, 1, 'lunch', null),
        (2, 1, STR_TO_DATE('2023-05-01', '%Y-%m-%d'), -2.50, 4, 2, 'train ticket', null),
        (3, 1, STR_TO_DATE('2023-05-01', '%Y-%m-%d'),  2500, 2, 4, 'monthly income', null),
        (4, 1, STR_TO_DATE('2023-05-02', '%Y-%m-%d'), -20, 4, 2, 'gas', null),
        (5, 1, STR_TO_DATE('2023-05-02', '%Y-%m-%d'), -45.30, 2, 3, 'groceries', null),
        (6, 1, STR_TO_DATE('2023-05-03', '%Y-%m-%d'), -12.55, 2, 1, 'dinner', null),
        (7, 1, STR_TO_DATE('2023-05-03', '%Y-%m-%d'), -400, 3, 5, 'AAPL stock', null),
        (8, 1, STR_TO_DATE('2023-05-03', '%Y-%m-%d'), -2.50, 4, 2, 'train ticket', null),
        (9, 1, STR_TO_DATE('2023-05-04', '%Y-%m-%d'), -3, 4, 2, 'MRT ticket', null),
        (10, 1, STR_TO_DATE('2023-05-05', '%Y-%m-%d'), -15, 2, 5, 'video game', null),
        (11, 1, STR_TO_DATE('2023-05-05', '%Y-%m-%d'), -8, 1, 1, 'lunch', null),
        (12, 1, STR_TO_DATE('2023-05-06', '%Y-%m-%d'), -85, 2, 5, 'chair', null),
        (13, 1, STR_TO_DATE('2023-05-06', '%Y-%m-%d'), -9.50, 1, 1, 'dinner', null),
        (14, 1, STR_TO_DATE('2023-05-07', '%Y-%m-%d'), -43, 1, 3, 'clothes', null),

        (1, 2, STR_TO_DATE('2023-05-01', '%Y-%m-%d'), -3, 1, 1, 'instant noodles', null),
        (2, 2, STR_TO_DATE('2023-05-01', '%Y-%m-%d'), -5, 1, 3, 'trinket', null),
        (3, 2, STR_TO_DATE('2023-05-02', '%Y-%m-%d'), -10, 2, 1, 'eggs', null),
        (4, 2, STR_TO_DATE('2023-05-02', '%Y-%m-%d'), -15, 3, 2, 'gas', null),
        (5, 2, STR_TO_DATE('2023-05-02', '%Y-%m-%d'), -20, 2, 3, 'games', null),
        (6, 2, STR_TO_DATE('2023-05-02', '%Y-%m-%d'), -14, 2, 3, 'fast food', null),
        (7, 2, STR_TO_DATE('2023-05-03', '%Y-%m-%d'), -42.5, 2, 1, 'random groceries', null),
        (8, 2, STR_TO_DATE('2023-05-03', '%Y-%m-%d'), -3.5, 1, 3, null, null),
        (9, 2, STR_TO_DATE('2023-05-04', '%Y-%m-%d'), -50, 2, 3, null, null),
        (10, 2, STR_TO_DATE('2023-05-04', '%Y-%m-%d'), -20, 1, 3, 'pizza hut', null),
        (11, 2, STR_TO_DATE('2023-05-05', '%Y-%m-%d'), -28.3, 1, 3, null, null),
        (12, 2, STR_TO_DATE('2023-05-05', '%Y-%m-%d'), -100, 2, 3, 'medicine', null),
        (13, 2, STR_TO_DATE('2023-05-06', '%Y-%m-%d'), -8, 3, 2, 'gas', null),
        (14, 2, STR_TO_DATE('2023-05-07', '%Y-%m-%d'), -25, 1, 1, 'more groceries', null),
        (15, 2, STR_TO_DATE('2023-05-07', '%Y-%m-%d'), -2, 2, 3, null, null),
        (16, 2, STR_TO_DATE('2023-05-07', '%Y-%m-%d'), -20, 3, 2, 'gas', null)
    `))



}

// createTables();
deleteAllData().then(()=>insertSampleData());