
const tbodyTrans = document.getElementById('tbodyTrans');

const inpDate = document.getElementById('inpDate');
const optionDay = document.getElementById('optionDay');
const optionMonth = document.getElementById('optionMonth');
const optionYear = document.getElementById('optionYear');

function main() {
    optionMonth.checked = true;
    inpDate.value = new Date().toISOString().slice(0, 10);
    generateTableData("MONTH",new Date(inpDate.value))
}

function generateTableData(grouping,date) {
    let year = date.getFullYear();
    let month = date.getMonth()+1;
    let day = date.getDate();
    let dateRangeCondition = ""
    if(grouping=="YEAR" || grouping=="MONTH" || grouping=="DAY") {
      dateRangeCondition += `AND YEAR(trans_date) = ${year} `
    }
    if(grouping=="MONTH" || grouping=="DAY") {
      dateRangeCondition += `AND MONTH(trans_date) = ${month} `
    }
    if(grouping=="DAY") {
      dateRangeCondition += `AND DAY(trans_date) = ${day} `
    }
  
    let command = "" +
    "SELECT trans_id, trans_date, trans_amount, cat_name, trans_desc " +
    "FROM transaction " +
    "JOIN category ON (transaction.cat_id = category.cat_id AND transaction.user_id = category.user_id) " +
    "JOIN user ON (transaction.user_id = user.user_id) " +
    `WHERE UPPER(user_name) = UPPER("${localStorage.getItem(KEY_USER)}") AND acc_id=${localStorage.getItem(KEY_ACCOUNT)} ` +
    dateRangeCondition + 
    ";"
    console.log(command)
    DatabaseObj.runSQLSelect(command)
    .then((jsonData) => {
        console.log(jsonData)
        tbodyTrans.innerHTML = ""
        for(let subData of jsonData) {
            let transID = Math.round(subData["trans_id"])
            tbodyTrans.innerHTML += `
            <tr
            class="border-b transition duration-300 ease-in-out hover:bg-neutral-100 dark:border-neutral-500 dark:hover:bg-neutral-600">
            <td class="whitespace-nowrap px-6 py-4" id="tdTransDate${transID}">${subData["trans_date"]}</td>
            <td class="whitespace-nowrap px-6 py-4" id="tdTransAmount${transID}">${Math.round(Number(subData["trans_amount"]))}</td>
            <td class="whitespace-nowrap px-6 py-4" id="tdTransCategory${transID}">${subData["cat_name"]}</td>
            <td class="whitespace-nowrap px-6 py-4" id="tdTransDesc${transID}">${subData["trans_desc"]}</td>
            <td class="whitespace-nowrap px-6 py-4">
                <button><i id="btnEdit${transID}" class="bi bi-pencil-square"></i></button>
                <button><i id="btnDelete${transID}" class="bi bi-trash"></i></button>
            </td>
            </tr>
            `
        }

        let categoryHTML = ""
        for(let category of Category.objList) {
            categoryHTML += `<option value=${category.id}>${category.name}</option>`
        }
        tbodyTrans.innerHTML += `
        <tr
        class="border-b transition duration-300 ease-in-out hover:bg-neutral-100 dark:border-neutral-500 dark:hover:bg-neutral-600">
        <td class="whitespace-nowrap px-6 py-4">
            <input class="w-full px-3 py-2 border border-gray-300 rounded-md" type="date" id="inpTransDate" name="date" placeholder="" value=${new Date().toISOString().slice(0, 10)}>
        </td>
        <td class="whitespace-nowrap px-6 py-4">
            <input class="w-full px-3 py-2 border border-gray-300 rounded-md" type="number" id="inpTransAmount" name="amount" placeholder="" value=0>
        </td>
        <td class="whitespace-nowrap px-6 py-4">
            <select class="w-full px-3 py-2 border border-gray-300 rounded-md" type="text" id="selTransCategory" name="category" placeholder="">${categoryHTML}</select>
        </td>
        <td class="whitespace-nowrap px-6 py-4">
            <input class="w-full px-3 py-2 border border-gray-300 rounded-md" type="text" id="inpTransDesc" name="desc" placeholder="">
        </td>
        <td class="whitespace-nowrap px-6 py-4">
            <button><i id="btnAddTrans" class="bi bi-plus-square"></i></button>
        </td>
        </tr>
        `
        for(let subData of jsonData) {
            let transID = Math.round(subData["trans_id"])
            document.getElementById(`btnEdit${transID}`).addEventListener('click',() => editTransaction(transID))
            document.getElementById(`btnDelete${transID}`).addEventListener('click',() => deleteTransaction(transID))
        }

        document.getElementById(`btnAddTrans`).addEventListener('click',() => addTransaction())

    })

}

let editingTransID = null 

function editTransaction(transID) {
    console.log(`edit: ${transID}`)
    if(editingTransID!=null) {
        setTransactionAsNonEditable(editingTransID)
    }
   
    if(transID!=editingTransID) {
        setTransactionAsEditable(transID)
        editingTransID = transID
    }
    else {
        editingTransID = null
    }
    
}

function setTransactionAsEditable(transID) {
    let tdTransDate = document.getElementById(`tdTransDate${transID}`)
    let tdTransAmount = document.getElementById(`tdTransAmount${transID}`)
    let tdTransCategory = document.getElementById(`tdTransCategory${transID}`)
    let tdTransDesc = document.getElementById(`tdTransDesc${transID}`)

    let transDate = tdTransDate.innerHTML
    let transAmount = tdTransAmount.innerHTML
    let transCategory = tdTransCategory.innerHTML
    let transDesc = tdTransDesc.innerHTML

    let categoryHTML = ""
    for(let category of Category.objList) {
        let selected = ""
        if(transCategory==category.name) {selected = `selected = "selected"`}
        categoryHTML += `<option value=${category.id} ${selected}>${category.name}</option>`
    }

    tdTransDate.innerHTML = `<input class="w-full px-3 py-2 border border-gray-300 rounded-md" type="date" id="inpTransDate${transID}" name="date" value=${transDate}>`
    tdTransAmount.innerHTML = `<input class="w-full px-3 py-2 border border-gray-300 rounded-md" type="number" id="inpTransAmount${transID}" name="amount" value=${transAmount}>`
    tdTransCategory.innerHTML = `<select class="w-full px-3 py-2 border border-gray-300 rounded-md" type="text" id="selTransCategory${transID}" name="category" value=${transCategory}>${categoryHTML}</select>`
    tdTransDesc.innerHTML = `<input class="w-full px-3 py-2 border border-gray-300 rounded-md" type="text" id="inpTransDesc${transID}" name="desc" value=${transDesc}>`

    let transaction = Transaction.findTransactionByID(transID)

    let inpTransDate = document.getElementById(`inpTransDate${transID}`)
    let inpTransAmount = document.getElementById(`inpTransAmount${transID}`)
    let selTransCategory = document.getElementById(`selTransCategory${transID}`)
    let inpTransDesc = document.getElementById(`inpTransDesc${transID}`)

    console.log(selTransCategory.value)

    inpTransDate.addEventListener("change", () => {transaction.date = inpTransDate.value});
    inpTransAmount.addEventListener("change", () => {transaction.amount = inpTransAmount.value});
    selTransCategory.addEventListener("change", () => {transaction.catID = selTransCategory.value});
    inpTransDesc.addEventListener("change", () => {transaction.desc = inpTransDesc.value});
}
function setTransactionAsNonEditable(transID) {
    let tdTransDate = document.getElementById(`tdTransDate${transID}`)
    let tdTransAmount = document.getElementById(`tdTransAmount${transID}`)
    let tdTransCategory = document.getElementById(`tdTransCategory${transID}`)
    let tdTransDesc = document.getElementById(`tdTransDesc${transID}`)

    let inpTransDate = document.getElementById(`inpTransDate${transID}`)
    let inpTransAmount = document.getElementById(`inpTransAmount${transID}`)
    let selTransCategory = document.getElementById(`selTransCategory${transID}`)
    let inpTransDesc = document.getElementById(`inpTransDesc${transID}`)

    let transDate = inpTransDate.value
    let transAmount = inpTransAmount.value
    let transCategory = selTransCategory.options[selTransCategory.selectedIndex].text
    let transDesc = inpTransDesc.value

    tdTransDate.innerHTML = transDate
    tdTransAmount.innerHTML = transAmount
    tdTransCategory.innerHTML = transCategory
    tdTransDesc.innerHTML = transDesc

}

function deleteTransaction(transID) {
    console.log(`delete: ${transID}`)
    let userID = User.findUserByName(localStorage.getItem(KEY_USER)).id
    DatabaseObj.runSQL(`DELETE FROM transaction WHERE user_id = ${userID} AND trans_id = ${transID}`).then(() => {console.log("transaction deleted!"); updateDateSelected()})
}



function addTransaction() {
    const inpTransDate = document.getElementById('inpTransDate');
    const inpTransAmount = document.getElementById('inpTransAmount');
    const selTransCategory = document.getElementById('selTransCategory');
    const inpTransDesc = document.getElementById('inpTransDesc');

    let userID = User.findUserByName(localStorage.getItem(KEY_USER)).id
    let accID = Number(localStorage.getItem(KEY_ACCOUNT))
    let transaction = new Transaction(null,userID,inpTransDate.value,inpTransAmount.value,
        accID,selTransCategory.value,inpTransDesc.value,null,false)
    transaction.insert(["trans_id","trans_transfer_id"]).then(() => {console.log("transaction inserted!"); updateDateSelected()})
}       

function updateDateSelected() {
    editingTransID = null 

    let grouping = document.querySelector('input[name="grouping"]:checked').value;
    let date = inpDate.value;
  
    console.log('Grouping:', grouping);
    console.log('Selected Date:', date);

    generateTableData(grouping.toUpperCase(),new Date(date))
}

inpDate.addEventListener('change', updateDateSelected);
optionDay.addEventListener('change', updateDateSelected);
optionMonth.addEventListener('change', updateDateSelected);
optionYear.addEventListener('change', updateDateSelected);

User.selectAll()
.then(()=>Category.selectWithCondition(`user_id = ${User.findUserByName(localStorage.getItem(KEY_USER)).id}`))
.then(()=>Transaction.selectWithCondition(`user_id = ${User.findUserByName(localStorage.getItem(KEY_USER)).id}`))
.then(()=>main())