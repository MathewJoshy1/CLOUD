import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { firebaseConfig, OWNER_NAMES, OWNER_PASS_HASH, hashPassword, OWNER_WHATSAPP_NUMBER } from './config.js';

const batchGroups = [
    { title: null, batches: ["+2 Science", "+2 Commerce", "+1 Science", "+1 Commerce"] },
    { title: "CBSE",  batches: ["10 CBSE", "9 CBSE", "8 CBSE", "6 CBSE", "5 CBSE", "4 CBSE"] },
    { title: "ICSE",  batches: ["10 ICSE", "9 ICSE", "7 ICSE"] },
    { title: "STATE", batches: ["10 State", "9 State"] }
];
const defaultBatches = batchGroups.flatMap(g => g.batches);

const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);

const initialData = {
    "+2 Science":  [
        { id:"id1",  no:1, name:"Alan Bygy",        subjects:"Physics, Chemistry, Maths", contact:"", fees:"Pending" },
        { id:"id2",  no:2, name:"Aleena Bygy",       subjects:"Physics, Chemistry, Maths", contact:"", fees:"Pending" },
        { id:"id3",  no:3, name:"Hrushikesh M",      subjects:"Physics, Chemistry, Maths", contact:"", fees:"Pending" },
        { id:"id4",  no:4, name:"Meghna",            subjects:"Physics, Chemistry, Maths", contact:"", fees:"Pending" },
        { id:"id5",  no:5, name:"Alphy",             subjects:"Maths",                     contact:"", fees:"Pending" },
        { id:"id6",  no:6, name:"Sara",              subjects:"Maths",                     contact:"", fees:"Pending" },
        { id:"id7",  no:7, name:"Lea Maria Rubin",   subjects:"Maths",                     contact:"", fees:"Pending" },
        { id:"id8",  no:8, name:"Joson",             subjects:"Physics, Chemistry",        contact:"", fees:"Pending" }
    ],
    "+2 Commerce": [
        { id:"id9",  no:1, name:"Aaron",    subjects:"Accountancy",                        contact:"", fees:"Pending" },
        { id:"id10", no:2, name:"Bastin",   subjects:"Accountancy",                        contact:"", fees:"Pending" },
        { id:"id11", no:3, name:"Leah Liju",subjects:"Accountancy",                        contact:"", fees:"Pending" },
        { id:"id12", no:4, name:"Mia",      subjects:"Accountancy, Maths",                 contact:"", fees:"Pending" },
        { id:"id13", no:5, name:"Iden",     subjects:"Accountancy, Business, Economics",   contact:"", fees:"Pending" }
    ],
    "+1 Science": [
        { id:"id14", no:1, name:"Rihan Jobin",  subjects:"Physics, Chemistry, Maths", contact:"", fees:"Pending" },
        { id:"id15", no:2, name:"Johny (Bini)", subjects:"Physics, Chemistry, Maths", contact:"", fees:"Pending" }
    ],
    "10 CBSE": [
        { id:"id16", no:1, name:"Meenakshi Santhosh", subjects:"PCM",   contact:"", fees:"Pending" },
        { id:"id17", no:2, name:"Alwin Sojo",          subjects:"PCM",   contact:"", fees:"Pending" },
        { id:"id18", no:3, name:"Eva Jain Joe",         subjects:"PCM",   contact:"", fees:"Pending" },
        { id:"id19", no:4, name:"Rayon Cyril",          subjects:"PCM",   contact:"", fees:"Pending" },
        { id:"id20", no:5, name:"Sreeranjini",          subjects:"PM",    contact:"", fees:"Pending" },
        { id:"id21", no:6, name:"Danshika PG",          subjects:"Maths", contact:"", fees:"Pending" },
        { id:"id22", no:7, name:"Darsiga PG",           subjects:"Maths", contact:"", fees:"Pending" },
        { id:"id23", no:8, name:"Keerthana KR",         subjects:"Maths", contact:"", fees:"Pending" },
        { id:"id24", no:9, name:"Agnes",                subjects:"Maths", contact:"", fees:"Pending" }
    ],
    "10 ICSE": [
        { id:"id25", no:1, name:"Ishan (Roshni)", subjects:"PCM",   contact:"", fees:"Pending" },
        { id:"id26", no:2, name:"Maria Dias",      subjects:"Maths", contact:"", fees:"Pending" }
    ],
    "9 ICSE": [
        { id:"id27", no:1, name:"Hanna Theresa Joshy",  subjects:"PCM", contact:"", fees:"Pending" },
        { id:"id28", no:2, name:"Serena Mariam Joshy",  subjects:"PCM", contact:"", fees:"Pending" }
    ],
    "9 State":  [{ id:"id29", no:1, name:"Abel Joseph John", subjects:"Maths", contact:"", fees:"Pending" }],
    "8 CBSE":   [
        { id:"id30", no:1, name:"Aryan Chris",       subjects:"PCM, History, Geography, English", contact:"", fees:"Pending" },
        { id:"id31", no:2, name:"Mathew Jaison Bejoy",subjects:"Maths",                            contact:"", fees:"Pending" },
        { id:"id32", no:3, name:"Ron Cyril",          subjects:"PCM",                              contact:"", fees:"Pending" }
    ],
    "7 ICSE":  [{ id:"id33", no:1, name:"Emmanuel",        subjects:"All subjects (11)", contact:"", fees:"Pending" }],
    "6 CBSE":  [{ id:"id34", no:1, name:"Josh (Daliya)",    subjects:"(6)",              contact:"", fees:"Pending" }],
    "5 CBSE":  [
        { id:"id35", no:1, name:"Evaan Elbin", subjects:"(7)", contact:"", fees:"Pending" },
        { id:"id36", no:2, name:"Iyyob",        subjects:"(6)", contact:"", fees:"Pending" }
    ],
    "4 CBSE":  [{ id:"id37", no:1, name:"Evan Joseph Cyril", subjects:"(6)", contact:"", fees:"Pending" }]
};

let studentsData = {};
let recycleBin   = []; // { ...studentFields, deletedFrom, deletedAt }

// ─── Sort state ───
let sortCol   = null;   // column key or null
let sortAsc   = true;

// ─── Init ───
function init() {
    setupEventListeners();

    // Load custom subjects from Firebase
    const subjectsRef = ref(db, 'customSubjects');
    onValue(subjectsRef, snapshot => {
        const data = snapshot.val();
        if (data && Array.isArray(data)) {
            // Merge: defaults first, then any custom ones not already in the list
            allSubjectsList = [...DEFAULT_SUBJECTS];
            data.forEach(s => { if (!allSubjectsList.includes(s)) allSubjectsList.splice(allSubjectsList.length - 1, 0, s); });
        }
    });

    // Load recycle bin from Firebase
    const binRef = ref(db, 'recycleBin');
    onValue(binRef, snapshot => {
        recycleBin = snapshot.val() || [];
        if (currentUserRole === 'owner') {
            renderBatches(batchSearchEl?.value || '');
            if (currentBatch === '__recycle__') renderTable(batchSearchEl?.value || '', document.getElementById('tableSearch')?.value || '');
        }
    });

    const dbRef = ref(db, 'studentsData');
    onValue(dbRef, snapshot => {
        const data = snapshot.val();
        if (data) {
            studentsData = data;
            if (window.location.protocol === 'file:' && !sessionStorage.getItem('migrated')) {
                sessionStorage.setItem('migrated', 'true');
                const stored = localStorage.getItem('christRegisterData');
                if (stored) {
                    showConfirm({ title:'Upload Local Data', message:"You have local student data. Upload it to the cloud database?", confirmText:'Upload', icon:'ph-cloud-arrow-up' }).then(ok => {
                        if (ok) try { set(dbRef, JSON.parse(stored)); showToast("Uploaded to cloud!", "success"); } catch(e) {}
                    });
                }
            }
        } else {
            const stored = localStorage.getItem('christRegisterData');
            try { studentsData = stored ? JSON.parse(stored) : initialData; } catch(e) { studentsData = initialData; }
            defaultBatches.forEach(b => { if (!studentsData[b]) studentsData[b] = []; });
            set(dbRef, studentsData);
        }
        
        // Auto-login via URL param
        const urlParams = new URLSearchParams(window.location.search);
        const autoStudentId = urlParams.get('viewStudent');
        if (autoStudentId && !currentUserRole) {
            let found = null;
            Object.values(studentsData).forEach(list => {
                const m = list.find(s => s.id === autoStudentId);
                if (m) found = m;
            });
            if (found) {
                enterApp('student', found.id);
                return; // enterApp calls renderBatches & renderTable
            }
        }

        // Restore session from sessionStorage (survives refresh)
        if (!currentUserRole) {
            const savedRole = sessionStorage.getItem('userRole');
            const savedId   = sessionStorage.getItem('userId');
            if (savedRole) {
                enterApp(savedRole, savedId || null);
                return;
            }
        }

        renderBatches(batchSearchEl?.value || "");
        renderTable(batchSearchEl?.value || "", document.getElementById('tableSearch')?.value || "");
    });
}

let currentBatch    = 'Home';
let currentUserRole = null;
let currentUserId   = null;

// ─── Custom Confirm / Alert Dialog ───
function showConfirm({ title = 'Are you sure?', message, confirmText = 'Confirm', danger = false, icon = 'ph-question' } = {}) {
    return new Promise(resolve => {
        const overlay     = document.getElementById('confirmOverlay');
        const titleEl     = document.getElementById('confirmTitle');
        const msgEl       = document.getElementById('confirmMsg');
        const iconEl      = document.getElementById('confirmIcon');
        const okBtn       = document.getElementById('confirmOkBtn');
        const cancelBtn   = document.getElementById('confirmCancelBtn');

        titleEl.textContent = title;
        msgEl.textContent   = message || '';
        iconEl.innerHTML    = `<i class="ph ${icon}"></i>`;
        iconEl.className    = `confirm-icon ${danger ? 'danger' : ''}`;
        okBtn.textContent   = confirmText;
        okBtn.className     = `btn-primary confirm-ok-btn ${danger ? 'btn-danger' : ''}`;

        overlay.classList.add('active');

        const cleanup = (result) => {
            overlay.classList.remove('active');
            okBtn.removeEventListener('click', onOk);
            cancelBtn.removeEventListener('click', onCancel);
            resolve(result);
        };
        const onOk     = () => cleanup(true);
        const onCancel = () => cleanup(false);

        okBtn.addEventListener('click', onOk);
        cancelBtn.addEventListener('click', onCancel);
    });
}

function showAlert({ title = 'Notice', message, icon = 'ph-info' } = {}) {
    return new Promise(resolve => {
        const overlay   = document.getElementById('confirmOverlay');
        const titleEl   = document.getElementById('confirmTitle');
        const msgEl     = document.getElementById('confirmMsg');
        const iconEl    = document.getElementById('confirmIcon');
        const okBtn     = document.getElementById('confirmOkBtn');
        const cancelBtn = document.getElementById('confirmCancelBtn');

        titleEl.textContent    = title;
        msgEl.textContent      = message || '';
        iconEl.innerHTML       = `<i class="ph ${icon}"></i>`;
        iconEl.className       = 'confirm-icon';
        okBtn.textContent      = 'OK';
        okBtn.className        = 'btn-primary confirm-ok-btn';
        cancelBtn.style.display = 'none';

        overlay.classList.add('active');

        const cleanup = () => {
            overlay.classList.remove('active');
            cancelBtn.style.display = '';
            okBtn.removeEventListener('click', onOk);
            resolve();
        };
        const onOk = () => cleanup();
        okBtn.addEventListener('click', onOk);
    });
}


function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="ph ${type === 'success' ? 'ph-check-circle' : 'ph-x-circle'}"></i><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.parentNode === container && container.removeChild(toast), 300);
    }, 3000);
}

// ─── Subjects list — starts with defaults, grows with custom ones ───
const DEFAULT_SUBJECTS = [
    "Physics","Chemistry","Maths","Biology","Computer Science",
    "Accountancy","Business","Economics","History","Geography",
    "Social","English","Malayalam","Hindi","All Subjects"
];
let allSubjectsList = [...DEFAULT_SUBJECTS];

// ─── Splash ───
document.addEventListener('DOMContentLoaded', () => {
    const splash = document.getElementById('splashScreen');
    const title  = document.getElementById('splashTitle');
    if (!title || !splash) return;
    const text = title.textContent.trim();
    title.innerHTML = '';
    let delay = 0.3;
    text.split(' ').forEach((word, wi, arr) => {
        const wrap = document.createElement('span');
        wrap.style.cssText = 'display:inline-block;white-space:nowrap;';
        for (const ch of word) {
            const s = document.createElement('span');
            s.textContent = ch;
            s.style.animationDelay = `${delay}s`;
            wrap.appendChild(s);
            delay += 0.05;
        }
        title.appendChild(wrap);
        if (wi < arr.length - 1) {
            const sp = document.createElement('span');
            sp.className = 'space';
            sp.style.cssText = 'display:inline-block;width:8px;';
            title.appendChild(sp);
        }
    });
    setTimeout(() => {
        splash.classList.add('fade-out');
        setTimeout(() => splash.style.display = 'none', 800);
    }, 2500);
});

// ─── Theme Toggle ───
document.addEventListener('DOMContentLoaded', () => {
    const btn  = document.getElementById('themeToggle');
    if (!btn) return;
    const icon = btn.querySelector('i');
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        icon.classList.replace('ph-moon','ph-sun');
    }
    btn.addEventListener('click', () => {
        const dark = document.body.classList.toggle('dark-mode');
        localStorage.setItem('theme', dark ? 'dark' : 'light');
        icon.classList.replace(dark ? 'ph-moon' : 'ph-sun', dark ? 'ph-sun' : 'ph-moon');
    });
});

// ─── DOM refs ───
const batchListEl        = document.getElementById('batchList');
const batchSearchEl      = document.getElementById('batchSearch');
const currentBatchTitleEl= document.getElementById('currentBatchTitle');
const studentCountEl     = document.getElementById('studentCount');
const studentsTableEl    = document.getElementById('studentsTable');
const studentsBodyEl     = document.getElementById('studentsBody');
const emptyStateEl       = document.getElementById('emptyState');
const mobileMenuBtn      = document.getElementById('mobileMenuBtn');
const closeSidebarBtn    = document.getElementById('closeSidebarBtn');
const sidebarOverlay     = document.getElementById('sidebarOverlay');
const sidebarEl          = document.querySelector('.sidebar');
const addStudentBtn      = document.getElementById('addStudentBtn');
const studentModal       = document.getElementById('studentModal');
const closeModalBtn      = document.getElementById('closeModalBtn');
const cancelModalBtn     = document.getElementById('cancelModalBtn');
const studentForm        = document.getElementById('studentForm');
const modalTitle         = document.getElementById('modalTitle');
const gatekeeperPortal   = document.getElementById('gatekeeperPortal');
const mainAppContainer   = document.getElementById('mainAppContainer');
const roleStudentBtn     = document.getElementById('roleStudentBtn');
const roleGuestBtn       = document.getElementById('roleGuestBtn');
const roleOwnerBtn       = document.getElementById('roleOwnerBtn');
const loginModal         = document.getElementById('loginModal');
const loginForm          = document.getElementById('loginForm');
const cancelLoginBtn     = document.getElementById('cancelLoginBtn');
const loginModalTitle    = document.getElementById('loginModalTitle');
const loginName          = document.getElementById('loginName');
const loginPassword      = document.getElementById('loginPassword');

let attemptingRole = null;

// ─── Render Batches ───
function renderBatches(filter = "") {
    batchListEl.innerHTML = "";

    if (currentUserRole !== 'owner') {
        if (batchSearchEl?.parentElement) batchSearchEl.parentElement.style.display = 'none';

        const makeItem = (icon, label, cls, onClick) => {
            const d = document.createElement('div');
            d.className = `batch-item ${cls}`;
            d.innerHTML = `<i class="ph ${icon}"></i> ${label}`;
            d.addEventListener('click', onClick);
            return d;
        };

        batchListEl.appendChild(makeItem('ph-pencil-simple','Edit Your Data','active', () => {
            let sb = null;
            Object.keys(studentsData).forEach(b => {
                if (studentsData[b].find(s => s.id === currentUserId)) sb = b;
            });
            if (sb) window.editStudent(currentUserId, sb);
        }));

        batchListEl.appendChild(makeItem('ph-sign-out','Log Out','', async () => {
            const ok = await showConfirm({ title:'Log Out', message:'Are you sure you want to log out?', confirmText:'Log Out', danger:true, icon:'ph-sign-out' });
            if (ok) logout();
        }));
        return;
    }

    if (batchSearchEl?.parentElement) batchSearchEl.parentElement.style.display = 'block';

    // Home
    const homeDiv = document.createElement('div');
    homeDiv.className = `batch-item ${currentBatch === 'Home' ? 'active' : ''}`;
    homeDiv.innerHTML = `<i class="ph ph-house"></i> Home`;
    homeDiv.addEventListener('click', () => selectBatch('Home'));
    if (!filter || 'home'.includes(filter.toLowerCase())) batchListEl.appendChild(homeDiv);

    batchGroups.forEach(group => {
        const filtered = group.batches.filter(b => b.toLowerCase().includes(filter.toLowerCase()));
        if (!filtered.length) return;

        let container = batchListEl;

        if (group.title) {
            const titleEl = document.createElement('div');
            titleEl.className = 'sidebar-subheading dropdown-toggle';

            // Count students for the group
            const groupTotal = group.batches.reduce((sum, b) => sum + (studentsData[b]?.length || 0), 0);
            titleEl.innerHTML = `<span>${group.title} <span class="batch-count-badge">${groupTotal}</span></span><i class="ph ph-caret-down"></i>`;

            const wrap  = document.createElement('div');
            wrap.className = 'dropdown-content';
            const inner = document.createElement('div');
            inner.className = 'dropdown-inner';
            wrap.appendChild(inner);

            if (filter || group.batches.includes(currentBatch)) {
                wrap.classList.add('open');
                titleEl.classList.add('open');
            }

            titleEl.addEventListener('click', () => {
                const opening = !wrap.classList.contains('open');
                if (opening) {
                    document.querySelectorAll('.dropdown-content.open').forEach(el => el.classList.remove('open'));
                    document.querySelectorAll('.sidebar-subheading.dropdown-toggle.open').forEach(el => el.classList.remove('open'));
                }
                wrap.classList.toggle('open', opening);
                titleEl.classList.toggle('open', opening);
            });

            batchListEl.appendChild(titleEl);
            batchListEl.appendChild(wrap);
            container = inner;
        }

        filtered.forEach(batch => {
            const count = studentsData[batch]?.length || 0;
            const div = document.createElement('div');
            div.className = `batch-item ${batch === currentBatch ? 'active' : ''} ${count === 0 ? 'batch-empty' : ''}`;
            div.innerHTML = `<i class="ph ph-folder-notch"></i> <span style="flex:1">${batch}</span><span class="batch-count-badge">${count}</span>`;
            div.addEventListener('click', () => selectBatch(batch));
            container.appendChild(div);
        });
    });

    // Recycle Bin + Logout
    const sep = document.createElement('div');
    sep.style.cssText = 'margin:20px 0;border-top:1px solid rgba(255,255,255,0.1);';
    batchListEl.appendChild(sep);

    const binCount = (recycleBin || []).length;
    const binDiv = document.createElement('div');
    binDiv.className = `batch-item ${currentBatch === '__recycle__' ? 'active' : ''}`;
    binDiv.innerHTML = `
        <i class="ph ph-recycle"></i>
        <span style="flex:1">Recycle Bin</span>
        ${binCount > 0 ? `<span class="recycle-badge">${binCount}</span>` : ''}`;
    binDiv.addEventListener('click', () => selectBatch('__recycle__'));
    batchListEl.appendChild(binDiv);

    const logoutDiv = document.createElement('div');
    logoutDiv.className = 'batch-item';
    logoutDiv.innerHTML = `<i class="ph ph-sign-out"></i> Log Out`;
    logoutDiv.style.color = '#ef4444';
    logoutDiv.addEventListener('click', async () => {
        const ok = await showConfirm({ title:'Log Out', message:'Are you sure you want to log out?', confirmText:'Log Out', danger:true, icon:'ph-sign-out' });
        if (ok) logout();
    });
    batchListEl.appendChild(logoutDiv);
}

function logout() {
    currentUserRole = null;
    currentUserId   = null;
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('userId');
    gatekeeperPortal.style.display = 'flex';
    mainAppContainer.style.display = 'none';
}

// ─── Select Batch ───
function selectBatch(batch) {
    currentBatch = batch;
    sortCol = null; sortAsc = true;
    currentBatchTitleEl.textContent = batch;
    if (sidebarEl) sidebarEl.classList.remove('mobile-open');
    if (sidebarOverlay) sidebarOverlay.classList.remove('active');
    document.querySelectorAll('.batch-item').forEach(el => {
        const textSpan = el.querySelector('span[style="flex:1"]');
        const itemName = textSpan ? textSpan.textContent.trim() : el.textContent.replace(/[0-9]+$/, '').trim();
        if (batch === 'Home') el.classList.toggle('active', itemName === 'Home');
        else if (batch === '__recycle__') el.classList.toggle('active', itemName === 'Recycle Bin');
        else el.classList.toggle('active', itemName === batch);
    });

    // Show/hide in-table search bar
    const tableSearchBar = document.getElementById('tableSearchBar');
    const tableSearch    = document.getElementById('tableSearch');
    if (tableSearchBar) {
        const show = batch !== 'Home';
        tableSearchBar.style.display = show ? 'flex' : 'none';
        if (tableSearch) tableSearch.value = '';
    }

    renderTable();
}

// ─── Subject count util ───
function calcSubjectCount(subjectString) {
    let count = 0;
    if (!subjectString || subjectString === '-') return 0;
    subjectString.split(',').forEach(p => {
        const sub = p.trim().toUpperCase();
        if (!sub) return;
        const m = sub.match(/\((\d+)\)/);
        if (m) count += parseInt(m[1]);
        else if (sub === 'PCM')  count += 3;
        else if (sub === 'PM')   count += 2;
        else if (sub === 'PCMB') count += 4;
        else count += 1;
    });
    return count;
}

// ─── Fees badge HTML ───
function feesBadge(student) {
    const fees = student.fees || 'Pending';
    const isPaid = fees === 'Paid';
    const bg    = isPaid ? '#D1FAE5' : '#FEE2E2';
    const color = isPaid ? '#059669' : '#DC2626';
    let html = `<span class="fees-badge" style="background:${bg};color:${color};">${fees}</span>`;
    if (isPaid) {
        const parts = [];
        if (student.feesAmountPaid) parts.push(`₹${student.feesAmountPaid} paid`);
        if (student.feesDatePaid)   parts.push(new Date(student.feesDatePaid).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}));
        if (student.feesRemaining && student.feesRemaining !== '0') parts.push(`₹${student.feesRemaining} remaining`);
        if (parts.length) html += `<div class="fees-meta">${parts.join(' · ')}</div>`;
    }
    return html;
}

// ─── Render Table ───
function renderTable(searchTerm = "", inClassSearch = "") {
    let students = [];
    let isAll = currentBatch === 'Home' || searchTerm.trim() !== "";

    if (currentUserRole !== 'owner') {
        isAll = true;
        Object.keys(studentsData).forEach(bn => {
            studentsData[bn].forEach(s => { if (s.id === currentUserId) students.push({...s, batchName: bn}); });
        });
        // Warm welcome greeting using student's first name
        const studentName = students.length > 0 ? students[0].name.split(' ')[0] : '';
        const hour = new Date().getHours();
        const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
        currentBatchTitleEl.innerHTML = `${greeting}, <span class="greeting-name">${studentName}</span> <span class="greeting-wave">👋</span>`;
        if (addStudentBtn) addStudentBtn.style.display = 'none';
    } else {
        if (addStudentBtn) addStudentBtn.style.display = 'flex';
        if (isAll) {
            Object.keys(studentsData).forEach(bn => {
                studentsData[bn].forEach(s => students.push({...s, batchName: bn}));
            });
            if (searchTerm.trim()) {
                const t = searchTerm.trim().toLowerCase();
                students = students.filter(s =>
                    (s.name      && s.name.toLowerCase().includes(t)) ||
                    (s.batchName && s.batchName.toLowerCase().includes(t)) ||
                    (s.subjects  && s.subjects.toLowerCase().includes(t)) ||
                    (s.contact   && s.contact.toLowerCase().includes(t))
                );
                currentBatchTitleEl.textContent = `Search: "${searchTerm}"`;
            } else {
                students.sort((a,b) => a.name.localeCompare(b.name));
                currentBatchTitleEl.textContent = currentBatch;
            }
        } else if (currentBatch === '__recycle__') {
            students = [...recycleBin];
            if (inClassSearch.trim()) {
                const t = inClassSearch.trim().toLowerCase();
                students = students.filter(s =>
                    (s.name     && s.name.toLowerCase().includes(t)) ||
                    (s.subjects && s.subjects.toLowerCase().includes(t)) ||
                    (s.contact  && s.contact.toLowerCase().includes(t))
                );
            }
            currentBatchTitleEl.textContent = 'Recycle Bin';
        } else {
            students = [...(studentsData[currentBatch] || [])];
            // In-class search filter
            if (inClassSearch.trim()) {
                const t = inClassSearch.trim().toLowerCase();
                students = students.filter(s =>
                    (s.name     && s.name.toLowerCase().includes(t)) ||
                    (s.subjects && s.subjects.toLowerCase().includes(t)) ||
                    (s.contact  && s.contact.toLowerCase().includes(t))
                );
            }
            students.sort((a,b) => a.no - b.no);
            currentBatchTitleEl.textContent = currentBatch;
        }
    }

    // ─ Column sort ─
    if (sortCol) {
        students.sort((a,b) => {
            let va = a[sortCol] || '', vb = b[sortCol] || '';
            if (sortCol === 'no') { va = a.no||0; vb = b.no||0; return sortAsc ? va-vb : vb-va; }
            if (sortCol === 'subCount') { va = a.subjectCount !== undefined ? a.subjectCount : calcSubjectCount(a.subjects); vb = b.subjectCount !== undefined ? b.subjectCount : calcSubjectCount(b.subjects); return sortAsc ? va-vb : vb-va; }
            return sortAsc ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
        });
    }

    studentCountEl.textContent = `${students.length} Student${students.length !== 1 ? 's' : ''}`;

    // Stats
    const statsContainer = document.getElementById('statsContainer');
    if (currentUserRole !== 'owner' || !isAll) {
        if (statsContainer) statsContainer.style.display = 'none';
    } else {
        statsContainer.style.display = 'flex';
        document.getElementById('statTotalStudents').textContent = students.length;
        document.getElementById('statTotalSubjects').textContent = students.reduce((sum,s) => sum + (s.subjectCount !== undefined ? s.subjectCount : calcSubjectCount(s.subjects)), 0);

        const chartContainer = document.getElementById('analyticsChartContainer');
        if (chartContainer) {
            chartContainer.style.display = 'block';
            const ctx = document.getElementById('analyticsChart');
            if (ctx && window.Chart) {
                const labels = Object.keys(studentsData);
                const data   = labels.map(b => studentsData[b].length);
                if (window.analyticsChartInstance) {
                    window.analyticsChartInstance.data.labels = labels;
                    window.analyticsChartInstance.data.datasets[0].data = data;
                    window.analyticsChartInstance.update();
                } else {
                    window.analyticsChartInstance = new Chart(ctx, {
                        type:'bar',
                        data:{ labels, datasets:[{ label:'Students', data, backgroundColor:'rgba(79,70,229,0.8)', borderRadius:6 }] },
                        options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true, ticks:{ stepSize:1 } } } }
                    });
                }
            }
        }
    }

    // ─ Build sortable headers ─
    const tableHeaders = document.getElementById('tableHeaders');
    const sortIndicator = col => {
        if (sortCol !== col) return '<i class="ph ph-arrows-down-up sort-icon"></i>';
        return sortAsc ? '<i class="ph ph-arrow-up sort-icon active"></i>' : '<i class="ph ph-arrow-down sort-icon active"></i>';
    };

    // Fees column visible to all; WhatsApp only to owner
    const feesCol    = `<th class="sortable" data-col="fees">Fees ${sortIndicator('fees')}</th>`;
    const waCol      = currentUserRole === 'owner' ? `<th>WhatsApp</th>` : '';
    const actionsCol = `<th style="width:100px;text-align:right;">Actions</th>`;
    const classCol   = (isAll || currentBatch === '__recycle__') ? `<th class="sortable" data-col="batchName">Class ${sortIndicator('batchName')}</th>` : '';
    const noCol      = `<th class="sortable" data-col="no" style="width:80px;">No. ${sortIndicator('no')}</th>`;
    const nameCol    = `<th class="sortable" data-col="name">Student Name ${sortIndicator('name')}</th>`;
    const subCol     = `<th class="sortable" data-col="subjects">Subjects ${sortIndicator('subjects')}</th>`;
    const subCntCol  = `<th class="sortable" data-col="subCount">Total Subj. ${sortIndicator('subCount')}</th>`;

    tableHeaders.innerHTML = classCol + noCol + nameCol + subCol + subCntCol + feesCol + waCol + actionsCol;

    // Attach sort click handlers
    tableHeaders.querySelectorAll('.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const col = th.dataset.col;
            if (sortCol === col) sortAsc = !sortAsc;
            else { sortCol = col; sortAsc = true; }
            renderTable(batchSearchEl?.value || '', document.getElementById('tableSearch')?.value || '');
        });
    });

    if (students.length === 0) {
        studentsTableEl.style.display = 'none';
        emptyStateEl.style.display = 'flex';
        if (currentBatch === '__recycle__') {
            emptyStateEl.innerHTML = `
                <i class="ph ph-trash" style="font-size: 48px; color: var(--text-muted); margin-bottom: 16px;"></i>
                <h3>No deleted data</h3>
                <p>Deleted student records will appear here.</p>
            `;
        } else {
            emptyStateEl.innerHTML = `
                <i class="ph ph-users" style="font-size: 48px; color: var(--text-muted); margin-bottom: 16px;"></i>
                <h3>No students in this class yet</h3>
                <p>Click the "Add New Student" button to get started.</p>
            `;
        }
        return;
    }

    studentsTableEl.style.display = 'table';
    emptyStateEl.style.display = 'none';
    studentsBodyEl.innerHTML = "";

    students.forEach((student, idx) => {
        const batchForAction = isAll ? student.batchName : currentBatch;
        const displayNo      = (isAll || currentBatch === '__recycle__') ? (idx + 1) : student.no;

        let subCount = student.subjectCount !== undefined ? student.subjectCount : calcSubjectCount(student.subjects);
        let cleanSub = (student.subjects || '-').replace(/\(\d+\)/g,'').trim();
        if (!cleanSub || /^,+$/.test(cleanSub)) cleanSub = '-';
        const subBadge = cleanSub !== '-'
            ? `<span class="subject-badge">${cleanSub}</span>`
            : `<span style="color:var(--text-muted)">-</span>`;

        let actionsHtml = '';
        if (currentBatch === '__recycle__') {
            actionsHtml = `
                <button class="icon-btn restore" onclick="restoreStudent('${student.id}')" title="Restore"><i class="ph ph-arrow-counter-clockwise"></i></button>
                <button class="icon-btn delete" onclick="permanentDeleteStudent('${student.id}')" title="Permanent Delete"><i class="ph ph-trash"></i></button>
            `;
        } else {
            const deleteBtn = currentUserRole === 'owner'
                ? `<button class="icon-btn delete" onclick="deleteStudent('${student.id}','${batchForAction}')"><i class="ph ph-trash"></i></button>`
                : '';
            actionsHtml = `
                <button class="icon-btn edit" onclick="editStudent('${student.id}','${batchForAction}')"><i class="ph ph-pencil-simple"></i></button>
                ${deleteBtn}
            `;
        }

        // WhatsApp button — owner only
        const cleanContact = student.contact ? student.contact.replace(/\D/g, '') : '';
        const waBtn = currentUserRole === 'owner' && cleanContact
            ? `<a href="https://wa.me/${cleanContact}" target="_blank" class="icon-btn whatsapp" title="WhatsApp ${student.name}"><i class="ph ph-whatsapp-logo"></i></a>`
            : (currentUserRole === 'owner' ? `<span style="color:var(--text-muted);font-size:12px;">—</span>` : '');

        const classCell = (isAll || currentBatch === '__recycle__')
            ? `<td class="col-class"><span class="class-badge">${student.batchName || student.deletedFrom}</span></td>`
            : '';

        const feesCell = `<td class="col-fees">${feesBadge(student)}</td>`;
        const waCell   = currentUserRole === 'owner' ? `<td class="col-wa">${waBtn}</td>` : '';

        const tr = document.createElement('tr');
        tr.style.opacity = '0';
        tr.style.transform = 'translateY(10px)';
        tr.innerHTML = `
            ${classCell}
            <td class="col-no"><strong>${displayNo}</strong></td>
            <td class="col-name" onclick="window.open('?viewStudent=${student.id}', '_blank')" style="color: var(--primary-color); cursor: pointer; font-weight: 600; text-decoration: underline; text-underline-offset: 4px;">${student.name}</td>
            <td class="col-subjects">${subBadge}</td>
            <td class="col-subcount" style="font-weight:600;text-align:center;">${subCount}</td>
            ${feesCell}
            ${waCell}
            <td class="col-actions action-btns" style="justify-content:flex-end;">
                ${actionsHtml}
            </td>`;
        studentsBodyEl.appendChild(tr);

        // Row entrance animation
        requestAnimationFrame(() => {
            setTimeout(() => {
                tr.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                tr.style.opacity = '1';
                tr.style.transform = 'translateY(0)';
            }, idx * 40);
        });
    });
}

// ─── Event Listeners ───
function setupEventListeners() {
    // Role cards
    roleStudentBtn?.addEventListener('click', () => openLoginModal('student', 'Student Login'));
    roleOwnerBtn?.addEventListener('click',   () => openLoginModal('owner',   'Owner Login'));

    roleGuestBtn?.addEventListener('click', () => {
        attemptingRole = 'guest';
        modalTitle.textContent = 'New Admission Registration';
        studentForm.reset();
        document.getElementById('studentId').value = '';
        populateBatchDropdown('');
        populateSubjectDropdown('');
        configureModalFields('guest', false);
        openModal();
    });

    cancelLoginBtn?.addEventListener('click', () => {
        loginModal.classList.remove('active');
        attemptingRole = null;
    });

    loginForm?.addEventListener('submit', async e => {
        e.preventDefault();
        await handleLogin(loginName.value.trim(), loginPassword.value);
    });

    // Mobile sidebar
    const toggleSidebar = show => {
        sidebarEl?.classList.toggle('mobile-open', show);
        sidebarOverlay?.classList.toggle('active', show);
    };
    mobileMenuBtn?.addEventListener('click',  () => toggleSidebar(true));
    closeSidebarBtn?.addEventListener('click', () => toggleSidebar(false));
    sidebarOverlay?.addEventListener('click',  () => toggleSidebar(false));

    // Global search (sidebar)
    batchSearchEl?.addEventListener('input', e => {
        renderBatches(e.target.value);
        renderTable(e.target.value, '');
    });

    // In-class search
    document.getElementById('tableSearch')?.addEventListener('input', e => {
        renderTable('', e.target.value);
    });

    // Print / PDF button
    const printBtn = document.getElementById('printBtn');
    printBtn?.addEventListener('click', () => printCurrentView());

    // Add student button
    addStudentBtn?.addEventListener('click', () => {
        modalTitle.textContent = 'Add New Student';
        studentForm.reset();
        document.getElementById('studentId').value = '';
        
        const activeBatch = (currentBatch === 'Home' || currentBatch === '__recycle__') ? '' : currentBatch;
        populateBatchDropdown(activeBatch);
        const defSubs = activeBatch ? defaultSubjectsFor(activeBatch) : '';
        populateSubjectDropdown(defSubs);
        
        setFeesToggle('Pending');
        const feesAmnt = document.getElementById('feesAmountPaid');
        if (feesAmnt) feesAmnt.value = '';
        const feesDate = document.getElementById('feesDatePaid');
        if (feesDate) feesDate.value = '';
        const feesRem = document.getElementById('feesRemaining');
        if (feesRem) feesRem.value = '';
        configureModalFields('owner', false);
        openModal();
    });

    closeModalBtn?.addEventListener('click', closeModal);
    cancelModalBtn?.addEventListener('click', e => { e.preventDefault(); closeModal(); });
    studentForm?.addEventListener('submit', e => { e.preventDefault(); saveStudent(); });

    // Custom selects toggle
    const ss  = document.getElementById('selectSelected');
    const si  = document.getElementById('selectItems');
    const sss = document.getElementById('subjectSelectSelected');
    const ssi = document.getElementById('subjectSelectItems');

    ss?.addEventListener('click', e => {
        e.stopPropagation();
        if (document.getElementById('customBatchSelect')?.classList.contains('disabled')) return;
        sss?.classList.remove('select-arrow-active');
        if (ssi) ssi.style.display = 'none';
        ss.classList.toggle('select-arrow-active');
        si.style.display = si.style.display === 'block' ? 'none' : 'block';
        if (si.style.display === 'none') ss.classList.remove('select-arrow-active');
    });

    sss?.addEventListener('click', e => {
        e.stopPropagation();
        ss?.classList.remove('select-arrow-active');
        if (si) si.style.display = 'none';
        sss.classList.toggle('select-arrow-active');
        ssi.style.display = ssi.style.display === 'block' ? 'none' : 'block';
        if (ssi.style.display === 'none') sss.classList.remove('select-arrow-active');
    });

    ssi?.addEventListener('click', e => e.stopPropagation());
    document.addEventListener('click', () => window.closeCustomSelect?.());
}

function openLoginModal(role, title) {
    attemptingRole = role;
    loginModalTitle.textContent = title;
    loginName.value = '';
    loginPassword.value = '';
    
    const pwdGroup = loginPassword.closest('.form-group');
    if (pwdGroup) {
        if (role === 'student') {
            pwdGroup.style.display = 'none';
            loginPassword.removeAttribute('required');
        } else {
            pwdGroup.style.display = 'block';
            loginPassword.setAttribute('required', 'required');
        }
    }
    
    loginModal.classList.add('active');
}

async function handleLogin(name, pwd) {
    if (attemptingRole === 'owner') {
        const hashedPwd = await hashPassword(pwd);
        if (OWNER_NAMES.some(o => o.toLowerCase().replace(/\s/g,'') === name.toLowerCase().replace(/\s/g,'')) && hashedPwd === OWNER_PASS_HASH) {
            enterApp('owner', null);
        } else {
            showToast("Invalid Owner Name or Password.", "error");
        }
    } else if (attemptingRole === 'student') {
        let found = null;
        Object.values(studentsData).forEach(list => {
            const m = list.find(s => s.name.toLowerCase() === name.toLowerCase());
            if (m) found = m;
        });
        if (found) enterApp('student', found.id);
        else showToast("Name not found in the registration system.", "error");
    }
}

function enterApp(role, userId) {
    currentUserRole = role;
    currentUserId   = userId;
    // Persist session so refresh doesn't log out
    sessionStorage.setItem('userRole', role);
    sessionStorage.setItem('userId',   userId || '');
    loginModal.classList.remove('active');
    gatekeeperPortal.style.display = 'none';
    mainAppContainer.style.display = '';
    currentBatch = 'Home';
    // Print button visible only for owner
    const printBtn = document.getElementById('printBtn');
    if (printBtn) printBtn.style.display = role === 'owner' ? 'flex' : 'none';
    renderBatches('');
    renderTable('');
}

window.closeCustomSelect = function() {
    ['selectSelected','subjectSelectSelected'].forEach(id => document.getElementById(id)?.classList.remove('select-arrow-active'));
    ['selectItems','subjectSelectItems'].forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });
};

function defaultSubjectsFor(batch) {
    if (batch.includes('Science'))  return "Physics, Chemistry, Maths";
    if (batch.includes('Commerce')) return "Accountancy, Maths, Business, Economics";
    if (batch.includes('10 ') || batch.includes('9 ')) return "PCM, Maths";
    return '';
}

function populateBatchDropdown(selectedBatch) {
    const si = document.getElementById('selectItems');
    const ss = document.getElementById('selectSelected');
    const hi = document.getElementById('studentBatchName');
    si.innerHTML = '';
    ss.textContent = selectedBatch || 'Select a Class';
    hi.value = selectedBatch || '';
    defaultBatches.forEach(batch => {
        const item = document.createElement('div');
        item.textContent = batch;
        if (batch === selectedBatch) item.classList.add('same-as-selected');
        item.addEventListener('click', function() {
            hi.value = this.textContent;
            ss.textContent = this.textContent;
            Array.from(si.children).forEach(c => c.classList.remove('same-as-selected'));
            this.classList.add('same-as-selected');
            populateSubjectDropdown(defaultSubjectsFor(this.textContent));
            window.closeCustomSelect();
        });
        si.appendChild(item);
    });
}

// ─── Save a new custom subject to Firebase ───
function saveCustomSubject(subject) {
    const custom = allSubjectsList.filter(s => !DEFAULT_SUBJECTS.includes(s));
    if (!custom.includes(subject)) custom.push(subject);
    set(ref(db, 'customSubjects'), [...DEFAULT_SUBJECTS, ...custom]);
}

function populateSubjectDropdown(subjectString) {
    const ssi = document.getElementById('subjectSelectItems');
    const sss = document.getElementById('subjectSelectSelected');
    const hsi = document.getElementById('studentSubjects');
    ssi.innerHTML = '';

    let expanded = [];
    if (subjectString) {
        subjectString.split(',').forEach(s => {
            const t = s.trim();
            if (t === 'PCM')       expanded.push('Physics','Chemistry','Maths');
            else if (t === 'PM')   expanded.push('Physics','Maths');
            else if (t === 'PCMB') expanded.push('Physics','Chemistry','Maths','Biology');
            else expanded.push(t);
        });
    }

    function update() {
        const cbs = ssi.querySelectorAll('input[type="checkbox"]');
        let allSel = false, sel = [];
        cbs.forEach(cb => { if (cb.value === 'All Subjects' && cb.checked) allSel = true; else if (cb.checked) sel.push(cb.value); });
        if (allSel)          { hsi.value = 'All Subjects'; sss.textContent = 'All Subjects'; }
        else if (sel.length) { hsi.value = sel.join(', ');  sss.textContent = sel.join(', '); }
        else                 { hsi.value = '';              sss.textContent = 'Select Subjects'; }
        const cnt = document.getElementById('liveSubjectCount');
        if (cnt) cnt.value = calcSubjectCount(hsi.value);
    }

    function addSubjectRow(subject, preChecked) {
        const d  = document.createElement('div');
        d.className = 'multi-select-item';
        const sp = document.createElement('span');
        sp.textContent = subject;
        const cb = document.createElement('input');
        cb.type = 'checkbox'; cb.value = subject;
        if (preChecked) cb.checked = true;

        d.addEventListener('click', e => { if (e.target !== cb) { cb.checked = !cb.checked; cb.dispatchEvent(new Event('change')); } });
        cb.addEventListener('change', e => {
            if (subject === 'All Subjects' && e.target.checked) {
                ssi.querySelectorAll('input[type="checkbox"]').forEach(c => { if (c.value !== 'All Subjects') c.checked = false; });
            } else if (e.target.checked) {
                const all = ssi.querySelector('input[value="All Subjects"]');
                if (all) all.checked = false;
            }
            update();
        });
        d.appendChild(sp); d.appendChild(cb);
        ssi.appendChild(d);
    }

    // Render all current subjects
    allSubjectsList.forEach(subject => addSubjectRow(subject, expanded.includes(subject)));

    // ── "Add new subject" row at the bottom ──
    const addRow = document.createElement('div');
    addRow.className = 'add-subject-row';
    addRow.innerHTML = `
        <i class="ph ph-plus-circle"></i>
        <input type="text" class="add-subject-input" placeholder="Add new subject..." maxlength="40">
        <button type="button" class="add-subject-btn" title="Add">
            <i class="ph ph-arrow-bend-down-left"></i>
        </button>`;
    ssi.appendChild(addRow);

    const input  = addRow.querySelector('.add-subject-input');
    const addBtn = addRow.querySelector('.add-subject-btn');

    // Prevent the subject dropdown from closing when clicking inside this row
    addRow.addEventListener('click', e => e.stopPropagation());
    input.addEventListener('click',  e => e.stopPropagation());

    const doAdd = () => {
        const val = input.value.trim();
        if (!val) { input.focus(); return; }
        // Capitalise first letter
        const formatted = val.charAt(0).toUpperCase() + val.slice(1);
        if (allSubjectsList.includes(formatted)) {
            // Already exists — just check it
            const existing = ssi.querySelector(`input[value="${CSS.escape(formatted)}"]`);
            if (existing) { existing.checked = true; existing.dispatchEvent(new Event('change')); }
            input.value = '';
            return;
        }
        // Insert before "All Subjects" (last item)
        allSubjectsList.splice(allSubjectsList.length - 1, 0, formatted);
        saveCustomSubject(formatted);
        // Re-render dropdown keeping current selections + new subject checked
        const currentlyChecked = Array.from(ssi.querySelectorAll('input[type="checkbox"]:checked')).map(c => c.value);
        currentlyChecked.push(formatted);
        populateSubjectDropdown(currentlyChecked.join(', '));
        // Re-open the dropdown
        ssi.style.display = 'block';
        const sssEl = document.getElementById('subjectSelectSelected');
        if (sssEl) sssEl.classList.add('select-arrow-active');
        showToast(`"${formatted}" added to subjects!`, "success");
    };

    addBtn.addEventListener('click', e => { e.stopPropagation(); doAdd(); });
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); doAdd(); } });

    update();
}

function openModal()  { studentModal.classList.add('active');    document.getElementById('studentName').focus(); }
function closeModal() { studentModal.classList.remove('active'); }

// ─── Fees toggle ───
function setFeesToggle(value) {
    const feesInput   = document.getElementById('studentFees');
    const pendingBtn  = document.getElementById('feesPendingBtn');
    const paidBtn     = document.getElementById('feesPaidBtn');
    const paidDetails = document.getElementById('feesPaidDetails');
    if (!feesInput) return;
    feesInput.value = value;
    pendingBtn.classList.toggle('active', value === 'Pending');
    paidBtn.classList.toggle('active',    value === 'Paid');
    paidDetails.style.display = value === 'Paid' ? 'block' : 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('feesPendingBtn')?.addEventListener('click', () => setFeesToggle('Pending'));
    document.getElementById('feesPaidBtn')?.addEventListener('click',    () => setFeesToggle('Paid'));
});

function saveStudent() {
    const id       = document.getElementById('studentId').value || generateId();
    const newBatch = document.getElementById('studentBatchName').value;
    if (!newBatch) { showToast("Please select a Class.", "error"); return; }

    const name     = document.getElementById('studentName').value.trim();
    if (!name) { showToast("Please enter a student name.", "error"); return; }
    const subjects = document.getElementById('studentSubjects').value;
    const manualSubCount = parseInt(document.getElementById('liveSubjectCount')?.value, 10) || 0;
    const contact  = document.getElementById('studentContact').value.trim();
    const fees     = document.getElementById('studentFees')?.value || 'Pending';
    const feesAmountPaid = fees === 'Paid' ? (document.getElementById('feesAmountPaid')?.value || '') : '';
    const feesDatePaid   = fees === 'Paid' ? (document.getElementById('feesDatePaid')?.value   || '') : '';
    const feesRemaining  = fees === 'Paid' ? (document.getElementById('feesRemaining')?.value  || '') : '';

    if (!studentsData[newBatch]) studentsData[newBatch] = [];

    let oldBatch = null, oldNo = null;
    Object.keys(studentsData).forEach(b => {
        const idx = studentsData[b].findIndex(s => s.id === id);
        if (idx >= 0) { oldBatch = b; oldNo = studentsData[b][idx].no; studentsData[b].splice(idx, 1); }
    });

    let no = oldNo || 1;
    if (!oldNo || oldBatch !== newBatch) {
        no = studentsData[newBatch].length > 0 ? Math.max(...studentsData[newBatch].map(s => s.no)) + 1 : 1;
    }

    studentsData[newBatch].push({ id, no, name, subjects, subjectCount: manualSubCount, contact, fees, feesAmountPaid, feesDatePaid, feesRemaining });
    saveToFirebase();
    closeModal();
    showToast(oldBatch ? "Student updated!" : "Student added!", "success");

    if (attemptingRole === 'guest') {
        currentUserRole = 'guest';
        currentUserId   = id;
        attemptingRole  = null;
        gatekeeperPortal.style.display = 'none';
        mainAppContainer.style.display = '';
        currentBatch = 'Home';
        renderBatches(''); renderTable('');
        showToast("Registration submitted!", "success");

        // Format and send registration details to owner's WhatsApp number
        const cleanSub = subjects ? subjects.replace(/\(\d+\)/g, '').trim() : '-';
        const formattedMsg = `*New Admission Registration* 📝\n\n` +
                             `👤 *Name:* ${name}\n` +
                             `🏫 *Class:* ${newBatch}\n` +
                             `🧪 *Subjects:* ${cleanSub}\n` +
                             `📞 *Contact:* ${contact || '-'}`;
        const waUrl = `https://wa.me/${OWNER_WHATSAPP_NUMBER}?text=${encodeURIComponent(formattedMsg)}`;
        window.open(waUrl, '_blank');
    } else {
        renderBatches(batchSearchEl?.value || '');
        renderTable(batchSearchEl?.value || '', document.getElementById('tableSearch')?.value || '');
    }
}

function configureModalFields(role, isEdit) {
    const nameInput = document.getElementById('studentName');
    const batchSelect = document.getElementById('customBatchSelect');
    const feesGroup = document.getElementById('feesPendingBtn')?.closest('.form-group');

    if (!nameInput || !batchSelect) return;

    // Reset fields to fully enabled state
    nameInput.disabled = false;
    batchSelect.classList.remove('disabled');
    if (feesGroup) feesGroup.style.display = 'block';

    if (role !== 'owner') {
        if (isEdit) {
            // Student or guest editing their own record
            nameInput.disabled = true;
            batchSelect.classList.add('disabled');
            if (feesGroup) feesGroup.style.display = 'none';
        } else {
            // Guest/New admission registering
            nameInput.disabled = false;
            batchSelect.classList.remove('disabled');
            if (feesGroup) feesGroup.style.display = 'none';
        }
    }
}

window.editStudent = function(id, batch) {
    const tb = batch || currentBatch;
    const s  = studentsData[tb]?.find(s => s.id === id);
    if (!s) return;

    modalTitle.textContent = 'Edit Student';
    document.getElementById('studentId').value      = s.id;
    populateBatchDropdown(tb);
    document.getElementById('studentName').value    = s.name;
    populateSubjectDropdown(s.subjects);
    document.getElementById('studentContact').value = s.contact || '';
    // Load fees
    setFeesToggle(s.fees || 'Pending');
    const fa = document.getElementById('feesAmountPaid');
    if (fa) fa.value = s.feesAmountPaid || '';
    const fd = document.getElementById('feesDatePaid');
    if (fd) fd.value = s.feesDatePaid || '';
    const fr = document.getElementById('feesRemaining');
    if (fr) fr.value = s.feesRemaining || '';
    
    // Load manual subject count (overrides automated count if present)
    const cnt = document.getElementById('liveSubjectCount');
    if (cnt) {
        cnt.value = s.subjectCount !== undefined ? s.subjectCount : calcSubjectCount(s.subjects);
    }

    configureModalFields(currentUserRole || 'student', true);
    openModal();
};

window.deleteStudent = function(id, batch) {
    if (currentUserRole !== 'owner') return;
    const tb = batch || currentBatch;
    showConfirm({ title:'Delete Student', message:'This will move the student record to the Recycle Bin.', confirmText:'Delete', danger:true, icon:'ph-trash' }).then(ok => {
        if (!ok) return;
        const idx = studentsData[tb]?.findIndex(s => s.id === id) ?? -1;
        if (idx !== -1) {
            const [deletedStudent] = studentsData[tb].splice(idx, 1);
            deletedStudent.deletedFrom = tb;
            deletedStudent.deletedAt = new Date().toISOString();
            recycleBin.push(deletedStudent);
            
            set(ref(db, 'recycleBin'), recycleBin);
            saveToFirebase();
            renderBatches(batchSearchEl?.value || '');
            renderTable(batchSearchEl?.value || '', document.getElementById('tableSearch')?.value || '');
            showToast("Student moved to Recycle Bin.", "success");
        }
    });
};

window.restoreStudent = function(id) {
    if (currentUserRole !== 'owner') return;
    showConfirm({ title:'Restore Student', message:'Restore this student to their original class?', confirmText:'Restore', icon:'ph-arrow-counter-clockwise' }).then(ok => {
        if (!ok) return;
        const idx = recycleBin.findIndex(s => s.id === id);
        if (idx !== -1) {
            const s = recycleBin.splice(idx, 1)[0];
            const targetBatch = s.deletedFrom;
            delete s.deletedFrom;
            delete s.deletedAt;
            if (!studentsData[targetBatch]) studentsData[targetBatch] = [];
            s.no = studentsData[targetBatch].length > 0 ? Math.max(...studentsData[targetBatch].map(x => x.no)) + 1 : 1;
            studentsData[targetBatch].push(s);
            
            set(ref(db, 'recycleBin'), recycleBin);
            saveToFirebase();
            renderBatches(batchSearchEl?.value || '');
            renderTable(batchSearchEl?.value || '', document.getElementById('tableSearch')?.value || '');
            showToast("Student restored.", "success");
        }
    });
};

window.permanentDeleteStudent = function(id) {
    if (currentUserRole !== 'owner') return;
    showConfirm({ title:'Permanent Delete', message:'This will permanently delete the record. Cannot be undone.', confirmText:'Delete', danger:true, icon:'ph-trash' }).then(ok => {
        if (!ok) return;
        const idx = recycleBin.findIndex(s => s.id === id);
        if (idx !== -1) {
            recycleBin.splice(idx, 1);
            set(ref(db, 'recycleBin'), recycleBin);
            renderBatches(batchSearchEl?.value || '');
            renderTable(batchSearchEl?.value || '', document.getElementById('tableSearch')?.value || '');
            showToast("Record permanently deleted.", "success");
        }
    });
};

function generateId()  { return Math.random().toString(36).substring(2, 11); }

// ─── Print / PDF ───
function printCurrentView() {
    const isHome = currentBatch === 'Home';
    const title  = isHome ? 'Christ Study Centre — All Students' : `Christ Study Centre — ${currentBatch}`;

    // Gather students to print
    let students = [];
    if (isHome) {
        Object.keys(studentsData).forEach(bn => {
            studentsData[bn].forEach(s => students.push({ ...s, batchName: bn }));
        });
        students.sort((a, b) => a.name.localeCompare(b.name));
    } else {
        students = [...(studentsData[currentBatch] || [])].sort((a, b) => a.no - b.no);
    }

    const feesColor = f => f === 'Paid' ? '#059669' : f === 'Partial' ? '#D97706' : '#DC2626';
    const feesBg    = f => f === 'Paid' ? '#D1FAE5' : f === 'Partial' ? '#FEF3C7' : '#FEE2E2';

    const rows = students.map((s, i) => {
        const cleanSub = (s.subjects || '-').replace(/\(\d+\)/g, '').trim() || '-';
        const subCount = s.subjectCount !== undefined ? s.subjectCount : calcSubjectCount(s.subjects);
        const fees     = s.fees || 'Pending';
        const feesDisplay = fees === 'Paid' && (s.feesAmountPaid || s.feesDatePaid || s.feesRemaining)
            ? `Paid${s.feesAmountPaid ? ' · ₹'+s.feesAmountPaid : ''}${s.feesRemaining && s.feesRemaining!=='0' ? ' · ₹'+s.feesRemaining+' rem.' : ''}`
            : fees;
        const classCell = isHome ? `<td>${s.batchName}</td>` : '';
        return `<tr>
            ${classCell}
            <td style="text-align:center;font-weight:700;">${isHome ? i + 1 : s.no}</td>
            <td>${s.name}</td>
            <td>${cleanSub}</td>
            <td style="text-align:center;font-weight:600;">${subCount}</td>
            <td>${s.contact || '—'}</td>
            <td style="text-align:center;">
                <span style="background:${feesBg(fees)};color:${feesColor(fees)};padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600;">${feesDisplay}</span>
            </td>
        </tr>`;
    }).join('');

    const classHeader = isHome ? '<th>Class</th>' : '';
    const date = new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' });

    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${title}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Inter', Arial, sans-serif; background:#fff; color:#111; padding: 32px; }
  .header { text-align:center; margin-bottom: 28px; border-bottom: 2px solid #4F46E5; padding-bottom: 20px; }
  .header h1 { font-size:24px; font-weight:700; color:#4F46E5; letter-spacing:0.5px; }
  .header h2 { font-size:16px; font-weight:600; color:#374151; margin-top:6px; }
  .header p  { font-size:12px; color:#6B7280; margin-top:4px; }
  table { width:100%; border-collapse:collapse; margin-top:8px; font-size:13px; }
  th { background:#4F46E5; color:white; padding:10px 12px; text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:0.5px; }
  td { padding:9px 12px; border-bottom:1px solid #E5E7EB; vertical-align:middle; }
  tr:nth-child(even) td { background:#F9FAFB; }
  tr:last-child td { border-bottom:none; }
  .footer { margin-top:24px; text-align:right; font-size:11px; color:#9CA3AF; }
  .total-row td { font-weight:700; background:#EEF2FF !important; color:#4F46E5; }
  @media print {
    body { padding: 16px; }
    button { display:none; }
  }
</style>
</head>
<body>
<div class="header">
  <h1>✦ Christ Study Centre</h1>
  <h2>${isHome ? 'Complete Student Register' : currentBatch + ' — Student Register'}</h2>
  <p>Printed on ${date} &nbsp;·&nbsp; ${students.length} student${students.length !== 1 ? 's' : ''}</p>
</div>
<table>
  <thead><tr>${classHeader}<th style="width:50px;">No.</th><th>Student Name</th><th>Subjects</th><th style="width:70px;text-align:center;">Subj.</th><th>WhatsApp</th><th style="width:90px;text-align:center;">Fees</th></tr></thead>
  <tbody>${rows}</tbody>
  <tfoot><tr class="total-row"><td colspan="${isHome ? 7 : 6}" style="padding:10px 12px;">Total: ${students.length} Student${students.length !== 1 ? 's' : ''}</td></tr></tfoot>
</table>
<div class="footer">Christ Study Centre Admission Register — Confidential</div>
<script>window.onload = () => { window.print(); }<\/script>
</body></html>`);
    win.document.close();
}

function saveToFirebase() { set(ref(db, 'studentsData'), studentsData); }

// ─── Start ───
init();
