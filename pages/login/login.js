// Errors

const errorLogin = document.getElementById('errorLogin');
const errorRegister = document.getElementById('errorRegister');

function resetErrors() {
    errorLogin.innerHTML = ""
    errorRegister.innerHTML = ""
}

// Tab switching functionality
const loginTab = document.getElementById('tabLogin');
const registerTab = document.getElementById('tabRegister');
const loginSection = document.getElementById('sectionLogin');
const registerSection = document.getElementById('sectionRegister');

loginTab.addEventListener('click', () => {
    loginTab.classList.add('bg-gray-900', 'text-white');
    registerTab.classList.add('bg-gray-300','text-gray-700');
    loginTab.classList.remove('bg-gray-300','text-gray-700');
    registerTab.classList.remove('bg-gray-900', 'text-white');
    
    loginSection.style.display = 'block';
    registerSection.style.display = 'none';
});

registerTab.addEventListener('click', () => {
    registerTab.classList.add('bg-gray-900', 'text-white');
    loginTab.classList.add('bg-gray-300','text-gray-700');
    registerTab.classList.remove('bg-gray-300','text-gray-700');
    loginTab.classList.remove('bg-gray-900', 'text-white');

    loginSection.style.display = 'none';
    registerSection.style.display = 'block';
});

// Login/Register functionality

const btnLogin = document.getElementById('btnLogin');
const btnRegister = document.getElementById('btnRegister');


const inpLoginUsername = document.getElementById('inpLoginUsername');
const inpLoginPassword = document.getElementById('inpLoginPassword');
const inpRegisterUsername = document.getElementById('inpRegisterUsername');
const inpRegisterPassword = document.getElementById('inpRegisterPassword');
const inpRegisterConfirmPassword = document.getElementById('inpRegisterConfirmPassword');


btnLogin.addEventListener('click', () => {
    let username = inpLoginUsername.value
    let password = inpLoginPassword.value

    if(username=="") {
        errorLogin.innerHTML = "please enter a username"
        return
    }
    else if(password=="") {
        errorLogin.innerHTML = "please enter a password"
        return
    }

    let user = User.findUserByName(username)
    if(user==null) {
        errorLogin.innerHTML = "invalid username"
    }
    else if(password!=user.password) {
        errorLogin.innerHTML = "incorrect password"
    }
    else {
        localStorage.setItem(KEY_USERID, user.id);
        window.location = "../overview/overview.html"
    }

});

btnRegister.addEventListener('click', () => {
    let username = inpRegisterUsername.value
    let password = inpRegisterPassword.value
    let confirmPassword = inpRegisterConfirmPassword.value

    if(username=="") {
        errorRegister.innerHTML = "please enter a username"
        return
    }
    else if(password=="") {
        errorRegister.innerHTML = "please enter a password"
        return
    }
    if(User.findUserByName(username)!=null) {
        errorRegister.innerHTML = "username already exists, please try again"
    }
    else if(password!=confirmPassword) {
        errorRegister.innerHTML = "confirmed password not the same as the password"
    }
    else {
        let u = new User(0,username,password,false)
        u.insert(["user_id"]).then((result)=>{
            localStorage.setItem(KEY_USER, u.name);
            window.location = "../overview/overview.html"
        });

    }
});


User.selectAll().then(() => {
    console.log(User.objList)
});

