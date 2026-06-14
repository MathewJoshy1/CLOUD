export const firebaseConfig = {
    apiKey: "AIzaSyCLISFSYBTiNpvo7H_TJ4j-LET5BsT4tiY",
    authDomain: "christ-register.firebaseapp.com",
    databaseURL: "https://christ-register-default-rtdb.firebaseio.com",
    projectId: "christ-register",
    storageBucket: "christ-register.firebasestorage.app",
    messagingSenderId: "34439499536",
    appId: "1:34439499536:web:759dfb61d46e07d1135f95"
};

export const OWNER_NAMES = ['Jyothis Joshy','Joshy Mathew','Mathew Joshy','Sona Joshy'];
// SHA-256 hash of the owner password ('4511')
export const OWNER_PASS_HASH = 'b780f20d75afc6afe44ccc270ba7e499c070a95e6535bcc71de8aa36ced3b5b6';
export const OWNER_WHATSAPP_NUMBER = '919747110790';

export async function hashPassword(password) {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
