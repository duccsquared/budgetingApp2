console.log(localStorage.getItem(KEY_USER))


const tbodyAccount = document.getElementById('tbodyAccount');
const tbodyCategory = document.getElementById('tbodyCategory');

const loginTab = document.getElementById('tabLogin');

const inpDate = document.getElementById('inpDate');
const optionDay = document.getElementById('optionDay');
const optionMonth = document.getElementById('optionMonth');
const optionYear = document.getElementById('optionYear');

function main() {

  optionMonth.checked = true;
  inpDate.value = new Date().toISOString().slice(0, 10);
  generateTableData("MONTH",new Date(inpDate.value))
  generateCategoryTableData()
}

function getJsonChildByKey(str,val,data, def = {}) {
  for(let subData of data) {
    if(subData[str]==val) {
      return subData 
    }
  }
  return def
}

function getTableData(baseData,posData,negData) {
  let result = []
  for(let subBaseData of baseData) {
    let accID = subBaseData["acc_id"]
    let subResult = [
      getJsonChildByKey("acc_id",String(accID),baseData)["acc_name"],
      getJsonChildByKey("acc_id",String(accID),posData,def={"trans_sum":0})["trans_sum"],
      getJsonChildByKey("acc_id",String(accID),negData,def={"trans_sum":0})["trans_sum"],
      getJsonChildByKey("acc_id",String(accID),baseData)["trans_sum"], 
      accID
    ];
    result.push(subResult)
  }
  return result
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
  "SELECT account.acc_id, user.user_id, acc_name, COALESCE(SUM(trans_amount),0) AS trans_sum " +
  "FROM account " +
  "JOIN user ON (account.user_id = user.user_id) " +
  "LEFT JOIN transaction ON (account.acc_id = transaction.acc_id AND account.user_id = transaction.user_id " +
  dateRangeCondition + ") " +
  `WHERE UPPER(user_name) = UPPER("${localStorage.getItem(KEY_USER)}") ` +
  
  "GROUP BY account.acc_id, user.user_id, acc_name " +
  "ORDER BY account.acc_id;"
  console.log(command)
  let commandPos = "" +
  "SELECT account.acc_id, user.user_id, acc_name, COALESCE(SUM(trans_amount),0) AS trans_sum " +
  "FROM account " +
  "JOIN user ON (account.user_id = user.user_id) " +
  "LEFT JOIN transaction ON (account.acc_id = transaction.acc_id AND account.user_id = transaction.user_id AND transaction.trans_amount >= 0 " +
  dateRangeCondition + ") " +
  `WHERE UPPER(user_name) =  UPPER("${localStorage.getItem(KEY_USER)}") ` +
  "GROUP BY account.acc_id, user.user_id, acc_name " +
  "ORDER BY account.acc_id;"

  let commandNeg = "" +
  "SELECT account.acc_id, user.user_id, acc_name, COALESCE(SUM(trans_amount),0) AS trans_sum " +
  "FROM account " +
  "JOIN user ON (account.user_id = user.user_id) " +
  "LEFT JOIN transaction ON (account.acc_id = transaction.acc_id AND account.user_id = transaction.user_id  AND transaction.trans_amount < 0 " +
  dateRangeCondition + ") " +
  `WHERE UPPER(user_name) =  UPPER("${localStorage.getItem(KEY_USER)}")` +
  "GROUP BY account.acc_id, user.user_id, acc_name " +
  "ORDER BY account.acc_id;"

  let baseData = null 
  let posData = null 
  let negData = null
  
  DatabaseObj.runSQLSelect(command)
    .then((jsonData)=> baseData = jsonData)
    .then(() => DatabaseObj.runSQLSelect(commandPos))
    .then((jsonData)=> posData = jsonData)
    .then(() => DatabaseObj.runSQLSelect(commandNeg))
    .then((jsonData)=> negData = jsonData)
    .then(() => {
      let results = getTableData(baseData,posData,negData)
      let userID = User.findUserByName(localStorage.getItem(KEY_USER)).id
      tbodyAccount.innerHTML = ""
      for(let accountData of results) {
        let accID = Math.round(Number(accountData[4]))
        tbodyAccount.innerHTML += `
        <tr
        class="border-b transition duration-300 ease-in-out hover:bg-neutral-100 dark:border-neutral-500 dark:hover:bg-neutral-600">
        <td class="whitespace-nowrap px-6 py-4 font-medium">${accountData[0]}</td>
        <td class="whitespace-nowrap px-6 py-4">${Math.round(Number(accountData[1]))}</td>
        <td class="whitespace-nowrap px-6 py-4">${Math.round(Number(accountData[2]))}</td>
        <td class="whitespace-nowrap px-6 py-4">${Math.round(Number(accountData[3]))}</td>
        <td class="whitespace-nowrap px-6 py-4">
            <button><i id="btnEdit${accID}" class="bi bi-pencil-square"></i></button>
            <button><i id="btnDelete${accID}" class="bi bi-trash"></i></button>
        </td>
        </tr>
        `
      }
      for(let accountData of results) {
        let accID = Math.round(Number(accountData[4]))
        document.getElementById(`btnEdit${accID}`).addEventListener('click',() => editAccount(userID,accID))
        document.getElementById(`btnDelete${accID}`).addEventListener('click',() => deleteAccount(userID,accID))
      }
    })
}

function generateCategoryTableData() {
  let command = "" +
  "SELECT cat_id, cat_name " +
  "FROM category " +
  "JOIN user ON (category.user_id = user.user_id) " +
  `WHERE UPPER(user_name) = UPPER("${localStorage.getItem(KEY_USER)}");`
  console.log(command)
  DatabaseObj.runSQLSelect(command)
  .then((jsonData) => {
    console.log(jsonData)
    tbodyCategory.innerHTML = ""
    for(let subData of jsonData) {
      let catID = Math.round(subData["cat_id"])
      tbodyCategory.innerHTML += `
      <tr
      class="border-b transition duration-300 ease-in-out hover:bg-neutral-100 dark:border-neutral-500 dark:hover:bg-neutral-600">
      <td class="whitespace-nowrap px-6 py-4" id="tdCatName${catID}">${subData["cat_name"]}</td>
      <td class="whitespace-nowrap px-6 py-4">
          <button><i id="btnDelete${catID}" class="bi bi-trash"></i></button>
      </td>
      </tr>
      `
    }
    tbodyCategory.innerHTML += `
    <tr
    class="border-b transition duration-300 ease-in-out hover:bg-neutral-100 dark:border-neutral-500 dark:hover:bg-neutral-600">
    <td class="whitespace-nowrap px-6 py-4">
        <input class="w-full px-3 py-2 border border-gray-300 rounded-md" type="text" id="inpCatName" name="name">
    </td>
    <td class="whitespace-nowrap px-6 py-4">
        <button><i id="btnAddCat" class="bi bi-plus-square"></i></button>
    </td>
    </tr>
    `
    for(let subData of jsonData) {
      let catID = Math.round(subData["cat_id"])
      document.getElementById(`btnDelete${catID}`).addEventListener('click',() => deleteCategory(catID))
    }

    document.getElementById(`btnAddCat`).addEventListener('click',() => addCategory())

  })
}

function editAccount(userID,accID) {
  console.log(`edit: ${userID} ${accID}`)
  localStorage.setItem(KEY_ACCOUNT, accID);
  window.location = "../accountTransactions/accountTransactions.html"
}
function deleteAccount(userID,accID) {
  console.log(`delete: ${userID} ${accID}`)
  DatabaseObj.runSQL(`DELETE FROM account WHERE user_id = ${userID} AND acc_id = ${accID}`).then(() => {console.log("account deleted!"); updateDateSelected()})
}

function addCategory() {
  let inpCatName = document.getElementById("inpCatName")
  if(inpCatName.value!='') {
    let userID = User.findUserByName(localStorage.getItem(KEY_USER)).id
    let acc = new Category(null,userID,inpCatName.value,false)
    acc.insert(["cat_id"]).then(() => {console.log("category inserted!"); generateCategoryTableData()})
  }
}
function deleteCategory(catID) {
  let userID = User.findUserByName(localStorage.getItem(KEY_USER)).id
  DatabaseObj.runSQL(`DELETE FROM category WHERE user_id = ${userID} AND cat_id = ${catID}`).then(() => {console.log("category deleted!"); generateCategoryTableData()})

}

function updateDateSelected() {
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

const inpAccName = document.getElementById('inpAccName');
const btnAddAccount = document.getElementById('btnAddAccount');

btnAddAccount.addEventListener('click',() => {
  let userID = User.findUserByName(localStorage.getItem(KEY_USER)).id
  if(inpAccName.value!='') {
    let acc = new Account(0,userID,inpAccName.value,0,false)
    acc.insert(["acc_id"]).then(() => {console.log("account inserted!"); updateDateSelected()})
  }
  
})


User.selectAll().then(() => Account.selectAll()).then(() => Transaction.selectAll()).then(() => main());
