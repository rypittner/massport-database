const SUPABASE_URL = 'https://ujyoxnrfchzyduhtcpaz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqeW94bnJmY2h6eWR1aHRjcGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyNzQ3MzUsImV4cCI6MjA4Mjg1MDczNX0.AWdu8ScAz8MqfzqKlcuxtNUncYq3m5pu59EMhef0-9M';
const LOCATIONIQ_KEY = 'pk.7fb90bfc2abb6e9b7ac921233aa0d0ce';
const IMGBB_API_KEY = '7dd3553ba2a58dca14721122d652e484';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const themes = ['#4478A2','#C65265','#D78143','#297381','#89974F','#DAAD60','#757498','#AA7876','#D7A995','#6E917A'];
const inkPalette = ['#1B4F72', '#78281F', '#186A3B', '#7E5109', '#512E5F'];
const stateIcons = { "AZ": "brightness_7", "CA": "beach_access", "PA": "notifications_active", "NY": "apartment", "FL": "sunny", "TX": "star", "WA": "coffee", "INTL": "public" };

let currentUser = null;
let currentStamps = [];
let activeFilter = 'ALL';

// AUTH
async function handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else location.reload();
}

async function handleSignUp() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const username = document.getElementById('username').value;
    const { error } = await supabaseClient.auth.signUp({ email, password, options: { data: { username } } });
    if (error) alert(error.message);
    else alert("Success! You can now log in.");
}

async function handleLogout() {
    await supabaseClient.auth.signOut();
    location.reload();
}

// DATA
async function fetchMyStamps() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return;
    currentUser = session.user;
    document.getElementById('auth-container').classList.add('hidden');
    document.getElementById('nav-bar').classList.remove('hidden');

    const { data } = await supabaseClient.from('stamps').select('*').eq('user_id', currentUser.id).order('created_at', {ascending: true});
    currentStamps = data;
    renderGrid('ALL');
    renderNav();
}

function renderGrid(filter) {
    const grid = document.getElementById('main-grid');
    grid.innerHTML = '';
    activeFilter = filter;

    const filtered = filter === 'ALL' ? currentStamps : currentStamps.filter(s => getGroupKey(s) === filter);
    
    // Update Header
    document.getElementById('sub-header').innerText = filter === 'ALL' ? 'TRAVEL ARCHIVE' : getFullStateName(filter);

    filtered.forEach((s, i) => {
        const wrap = document.createElement('div');
        wrap.className = 'stamp-wrapper stagger-in';
        wrap.style.animationDelay = `${i * 0.1}s`;
        
        const rot = (Math.random() * 6 - 3).toFixed(1);
        const sealRot = (Math.random() * 40 - 20).toFixed(1);
        const theme = themes[i % themes.length];
        const city = s.city.split(',')[0];

        wrap.innerHTML = `
            <div class="stamp" style="--theme-color: ${theme}; --r_deg: ${rot}deg" onclick="viewStamp(${i})">
                <div class="stamp-image">
                    ${s.img_url ? `<img src="${s.img_url}">` : `<div class="placeholder pattern-1"></div>`}
                    <div class="stamp-title-overlay">
                        <div class="stamp-name">${s.name}</div>
                        <div class="stamp-note">${s.notes || ''}</div>
                    </div>
                </div>
            </div>
            <div class="postmark-seal" style="--seal-rot: ${sealRot}deg">
                <div class="pm-line"></div>
                <div class="pm-city">${city}</div>
                <div class="pm-line"></div>
            </div>`;
        grid.appendChild(wrap);
    });
    setupMobileScroll();
}

function renderNav() {
    const nav = document.getElementById('filter-nav');
    nav.innerHTML = '';
    const groups = [...new Set(currentStamps.map(s => getGroupKey(s)))];

    // ALL button
    const allBtn = createNavTag('ALL', '#4478A2');
    allBtn.classList.add('active');
    allBtn.style.background = '#4478A2';
    allBtn.style.color = 'white';
    nav.appendChild(allBtn);

    groups.forEach((g, i) => {
        const color = inkPalette[i % inkPalette.length];
        nav.appendChild(createNavTag(g, color));
    });
}

function createNavTag(label, color) {
    const tag = document.createElement('div');
    tag.className = 'nav-tag';
    tag.innerText = label;
    tag.onclick = () => {
        document.querySelectorAll('.nav-tag').forEach(t => {
            t.classList.remove('active');
            t.style.background = '#eee';
            t.style.color = '#444';
        });
        tag.classList.add('active');
        tag.style.background = color;
        tag.style.color = 'white';
        renderGrid(label);
        
        // Auto-scroll on Mobile
        if(window.innerWidth <= 600) {
            document.getElementById('main-grid').scrollTo({ left: 0, behavior: 'smooth' });
        }
    };
    return tag;
}

// HELPERS
function getGroupKey(s) {
    if (!s.city.includes(',')) return 'INTL';
    const part = s.city.split(',').pop().trim();
    return part.length === 2 ? part : 'INTL';
}

function getFullStateName(abbr) {
    const states = {"AZ":"ARIZONA","CA":"CALIFORNIA","NY":"NEW YORK","FL":"FLORIDA","TX":"TEXAS","WA":"WASHINGTON"};
    return states[abbr] || abbr;
}

function setupMobileScroll() {
    if(window.innerWidth > 600) return;
    const grid = document.getElementById('main-grid');
    grid.addEventListener('scroll', () => {
        const center = window.innerWidth / 2;
        document.querySelectorAll('.stamp-wrapper').forEach(card => {
            const rect = card.getBoundingClientRect();
            const dist = Math.abs(center - (rect.left + rect.width/2));
            card.classList.toggle('is-centered', dist < 100);
        });
    });
}

// INITIALIZE
fetchMyStamps();
