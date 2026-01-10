const SUPABASE_URL = 'https://ujyoxnrfchzyduhtcpaz.supabase.co';
const SUPABASE_KEY = 'YOUR_KEY_HERE';
const LOCATIONIQ_KEY = 'pk.7fb90bfc2abb6e9b7ac921233aa0d0ce';
const IMGBB_API_KEY = '7dd3553ba2a58dca14721122d652e484';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const themes = ['#4478A2','#C65265','#D78143','#297381','#89974F','#DAAD60','#757498','#AA7876','#D7A995','#6E917A'];
const stateIcons = { "AZ": "brightness_7", "CA": "beach_access", "PA": "notifications_active", "EU": "public", "NY": "apartment", "FL": "sunny", "TX": "star", "NV": "playing_cards", "WA": "coffee", "HI": "surfing", "CO": "mountain_flag", "MA": "history_edu", "IL": "location_city", "LA": "music_note", "TN": "music_note", "GA": "agriculture", "OR": "forest", "ME": "sailing", "DC": "gavel", "UT": "hiking", "NM": "light_mode", "OH": "flight", "MI": "kayaking", "AK": "ac_unit", "WI": "forest", "VT": "ac_unit", "MT":"landscape", "NE":"psychiatry", "INTL": "public" };
const abbrToState = { "AL":"ALABAMA","AK":"ALASKA","AZ":"ARIZONA","AR":"ARKANSAS","CA":"CALIFORNIA","CO":"COLORADO","CT":"CONNECTICUT","DE":"DELAWARE","FL":"FLORIDA","GA":"GEORGIA","HI":"HAWAII","ID":"IDAHO","IL":"ILLINOIS","IN":"INDIANA","IA":"IOWA","KS":"KANSAS","KY":"KENTUCKY","LA":"LOUISIANA","ME":"MAINE","MD":"MARYLAND","MA":"MASSACHUSETTS","MI":"MICHIGAN","MN":"MINNESOTA","MS":"MISSISSIPPI","MO":"MISSOURI","MT":"MONTANA","NE":"NEBRASKA","NV":"NEVADA","NH":"NEW HAMPSHIRE","NJ":"NEW JERSEY","NM":"NEW MEXICO","NY":"NEW YORK","NC":"NORTH CAROLINA","ND":"NORTH DAKOTA","OH":"OHIO","OK":"OKLAHOMA","OR":"OREGON","PA":"PENNSYLVANIA","RI":"RHODE ISLAND","SC":"SOUTH CAROLINA","SD":"SOUTH DAKOTA","TN":"TENNESSEE","TX":"TEXAS","UT":"UTAH","VT":"VERMONT","VA":"VIRGINIA","WA":"WASHINGTON","WV":"WEST VIRGINIA","WI":"WISCONSIN","WY":"WYOMING", "DC": "DISTRICT OF COLUMBIA" };

let currentUser = null;
let allStamps = [];
let currentFilter = 'ALL';

// Auth Setup
async function initAuth() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        currentUser = session.user;
        document.getElementById('auth-container').classList.add('hidden');
        document.getElementById('nav-bar').classList.remove('hidden');
        fetchStamps();
    }
}

async function handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) alert(error.message); else location.reload();
}

async function handleSignUp() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const username = document.getElementById('username').value;
    const { error } = await supabaseClient.auth.signUp({ 
        email, password, options: { data: { username } } 
    });
    if (error) alert(error.message); else alert("Verify email if required, otherwise try logging in!");
}

async function fetchStamps() {
    const { data } = await supabaseClient.from('stamps').select('*').eq('user_id', currentUser.id);
    allStamps = data || [];
    processAndRender();
}

function processAndRender(filter = 'ALL') {
    currentFilter = filter;
    const grid = document.getElementById('main-grid');
    grid.innerHTML = '';

    const groups = {};
    allStamps.forEach(s => {
        const group = (s.country_code === 'US' && s.state_code) ? s.state_code : 'INTL';
        if (!groups[group]) groups[group] = [];
        groups[group].push(s);
    });

    renderNav(groups);

    let displayData = [];
    if (filter === 'ALL') {
        Object.keys(groups).forEach(code => {
            displayData.push({ type: 'ink', code: code });
            groups[code].forEach(s => displayData.push({ ...s, type: 'paper' }));
        });
    } else {
        displayData.push({ type: 'ink', code: filter });
        groups[filter].forEach(s => displayData.push({ ...s, type: 'paper' }));
        const fullName = abbrToState[filter] || (filter === 'INTL' ? 'INTERNATIONAL' : filter);
        document.getElementById('group-display').innerText = fullName;
    }

    displayData.forEach((item, i) => {
        const wrap = document.createElement('div');
        wrap.className = 'stamp-wrapper stagger-in';
        wrap.style.animationDelay = `${i * 0.08}s`;
        
        if (item.type === 'ink') {
            wrap.innerHTML = `<div class="ink-stamp" style="--ink-color:#4478A2"><div class="ink-abbr">${item.code}</div></div>`;
        } else {
            const rot = (Math.random() * 6 - 3).toFixed(1);
            wrap.innerHTML = `
                <div class="stamp" style="--theme-color: ${themes[i % themes.length]}; --r_deg: ${rot}deg">
                    <div class="stamp-image"><img src="${item.img_url || ''}"></div>
                </div>
                <div class="postmark-seal" style="--seal-rot: 10deg">
                    <div class="pm-line"></div><div class="pm-city">${item.city.split(',')[0]}</div><div class="pm-line"></div>
                </div>`;
        }
        grid.appendChild(wrap);
    });
}

function renderNav(groups) {
    const nav = document.getElementById('filter-nav');
    nav.innerHTML = '';
    const keys = Object.keys(groups);
    keys.forEach(k => {
        const btn = document.createElement('div');
        btn.className = 'nav-tag';
        btn.innerText = k;
        if (currentFilter === k) {
            btn.classList.add('active');
            btn.style.background = '#4478A2'; // Color matches ink stamp logic
        }
        btn.onclick = () => {
            if (window.innerWidth < 601) {
                // Mobile: Scroll to it
                document.getElementById(`group-${k}`)?.scrollIntoView({ behavior: 'smooth' });
            } else {
                // Desktop: Filter
                processAndRender(k);
            }
        };
        nav.appendChild(btn);
    });
}

initAuth();
