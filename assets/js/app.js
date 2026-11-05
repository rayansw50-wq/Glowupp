let PRODUCTS = [];

// تحميل المنتجات من SQL Server
async function loadProducts() {
    try {
        const response = await fetch('http://localhost:5217/api/products');

        if (!response.ok) {
            throw new Error('فشل تحميل المنتجات');
        }

        const data = await response.json();

        PRODUCTS = data.map(p => ({
            id: p.id,
            name: p.name,
            brand: p.brand,
            category: getCategory(p.name),
            skin: Array.isArray(p.skin) ? p.skin : [],
            price: Number(p.price),
            desc: 'منتج للعناية بالبشرة',
            image: p.image
        }));

        fillBrandFilter();
        renderFeatured();
        renderProducts();
        renderCart();

        if ($('#routine-result') && $('#skin-type')) {
            renderRoutine($('#skin-type').value);
        }

        console.log('تم تحميل المنتجات من SQL Server');

    } catch (error) {
        console.error(error);
        toast('تعذر تحميل المنتجات من قاعدة البيانات');
    }
}

// تحديد نوع المنتج من اسمه
function getCategory(name) {
    if (name.includes('غسول')) return 'غسول';
    if (name.includes('سيروم')) return 'سيروم';
    if (name.includes('واقي شمس')) return 'واقي شمس';
    if (name.includes('ماء')) return 'تونر';
    if (name.includes('مرطب') || name.includes('كريم')) return 'مرطب';
    return '';
}

// تعبئة قائمة الماركات
function fillBrandFilter() {
    const b = $('#brand-filter');
    if (!b) return;

    PRODUCTS.forEach(p => {
        const exists = [...b.options].some(option => option.value === p.brand);

        if (!exists) {
            const option = document.createElement('option');
            option.value = p.brand;
            option.textContent = p.brand;
            b.appendChild(option);
        }
    });
}

const routines = {
    'دهنية': [
        ['غسول', 'اختاري غسولاً لطيفاً يساعد على إزالة الدهون الزائدة.'],
        ['سيروم', 'يمكن اختيار سيروم مناسب وخفيف حسب احتياج البشرة.'],
        ['مرطب', 'استخدمي مرطباً خفيفاً لا يترك إحساساً دهنياً.'],
        ['واقي شمس', 'ضعي واقي شمس واسع الطيف صباحاً.']
    ],
    'جافة': [
        ['غسول', 'استخدمي غسولاً كريميّاً لطيفاً لا يجرّد البشرة من زيوتها.'],
        ['سيروم', 'يمكن إضافة سيروم مرطب.'],
        ['مرطب', 'اختاري كريماً غنياً للحفاظ على الترطيب.'],
        ['واقي شمس', 'اختمي روتين الصباح بواقي الشمس.']
    ],
    'مختلطة': [
        ['غسول', 'نظفي البشرة بغسول لطيف.'],
        ['سيروم', 'اختاري سيروماً يناسب احتياجاتك.'],
        ['مرطب', 'استخدمي مرطباً خفيفاً ومتوازناً.'],
        ['واقي شمس', 'استخدمي واقي شمس كل صباح.']
    ],
    'حساسة': [
        ['غسول', 'اختاري غسولاً بسيطاً خالياً من العطر قدر الإمكان.'],
        ['سيروم', 'تجنبي كثرة المواد الفعالة وابدئي تدريجياً.'],
        ['مرطب', 'استخدمي مرطباً مهدئاً ولطيفاً.'],
        ['واقي شمس', 'اختاري واقياً مناسباً للبشرة الحساسة.']
    ],
    'معرضة للحبوب': [
        ['غسول', 'استخدمي غسولاً لطيفاً دون فرك.'],
        ['سيروم', 'اختاري مكونات مناسبة وابدئي بالتدريج.'],
        ['مرطب', 'لا تهملي الترطيب حتى لو كانت البشرة دهنية.'],
        ['واقي شمس', 'استخدمي واقي شمس لا يسد المسام إن أمكن.']
    ]
};

const $ = s => document.querySelector(s);

function getCart() {
    try {
        return JSON.parse(localStorage.getItem('glowup_cart') || '[]');
    } catch {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem('glowup_cart', JSON.stringify(cart));
    updateCount();
}

function updateCount() {
    const n = getCart().reduce((s, x) => s + x.qty, 0);
    document.querySelectorAll('.cart-count').forEach(e => e.textContent = n);
}

function productCard(p) {
    return `<article class="product-card">
        <img src="${p.image}" alt="${p.name}" loading="lazy">
        <div class="product-info">
            <span class="product-brand">${p.brand} · ${p.category}</span>
            <h3>${p.name}</h3>
            <p>${p.desc}</p>
            <div class="product-bottom">
                <b>${p.price} د.ل</b>
                <button class="add-btn" data-add="${p.id}">أضيفي للسلة +</button>
            </div>
        </div>
    </article>`;
}

function addProduct(id) {
    const p = PRODUCTS.find(x => x.id === Number(id));
    if (!p) return;

    const c = getCart();
    const found = c.find(x => x.id === p.id);

    found ? found.qty++ : c.push({ id: p.id, qty: 1 });

    saveCart(c);
    toast('انضاف المنتج للسلة ♡');
}

function toast(msg) {
    let t = $('#toast');

    if (!t) {
        t = document.createElement('div');
        t.id = 'toast';
        t.className = 'toast';
        document.body.append(t);
    }

    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2200);
}

function renderFeatured() {
    const el = $('#featured-products');
    if (el) {
        el.innerHTML = PRODUCTS.slice(0, 3).map(productCard).join('');
    }
}

function renderProducts() {
    const el = $('#all-products');
    if (!el) return;

    const search = ($('#search-input')?.value || '').trim().toLowerCase();
    const brand = $('#brand-filter')?.value || '';
    const skin = $('#skin-filter')?.value || '';
    const cat = $('#category-filter')?.value || '';

    const list = PRODUCTS.filter(p =>
        (p.name.toLowerCase().includes(search) ||
         p.brand.toLowerCase().includes(search)) &&
        (!brand || p.brand === brand) &&
        (!skin || p.skin.includes(skin)) &&
        (!cat || p.category === cat)
    );

    el.innerHTML = list.length
        ? list.map(productCard).join('')
        : '<p class="empty-state">ما لقيناش منتجات مطابقة. جرّبي تغيير البحث.</p>';
}

function initFilters() {
    ['search-input', 'brand-filter', 'skin-filter', 'category-filter']
        .forEach(id => {
            const element = $('#' + id);

            if (element) {
                element.addEventListener(
                    id === 'search-input' ? 'input' : 'change',
                    renderProducts
                );
            }
        });
}

function renderRoutine(type) {
    const result = $('#routine-result');
    if (!result) return;

    const steps = routines[type] || routines['دهنية'];
    const picks = PRODUCTS.filter(p => p.skin.includes(type));

    result.innerHTML = `
        <h2>روتين مقترح للبشرة ${type}</h2>
        <div class="routine-steps">
            ${steps.map((s, i) => `
                <article class="routine-step">
                    <span>${i + 1}</span>
                    <div>
                        <h3>${s[0]}</h3>
                        <p>${s[1]}</p>
                    </div>
                </article>
            `).join('')}
        </div>
        <h2 class="routine-products-title">منتجات قد تناسبك</h2>
        <div class="product-grid">
            ${picks.map(productCard).join('')}
        </div>`;
}

function renderCart() {
    const el = $('#cart-content');
    if (!el) return;

    const cart = getCart();

    if (!cart.length) {
        el.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">♡</div>
                <h2>سلتك فارغة</h2>
                <p>ابدئي باختيار المنتجات اللي تعجبك.</p>
                <a class="btn" href="products.html">تصفحي المنتجات</a>
            </div>`;
        return;
    }

    let total = 0;

    const rows = cart.map(item => {
        const p = PRODUCTS.find(x => x.id === item.id);
        if (!p) return '';

        total += p.price * item.qty;

        return `
            <article class="cart-row">
                <img src="${p.image}" alt="${p.name}">
                <div class="cart-details">
                    <h3>${p.name}</h3>
                    <small>${p.brand}</small>
                    <b>${p.price} د.ل</b>
                </div>
                <div class="qty">
                    <button data-qty="${p.id}" data-change="-1">−</button>
                    <span>${item.qty}</span>
                    <button data-qty="${p.id}" data-change="1">+</button>
                </div>
                <button class="remove-btn" data-remove="${p.id}">حذف</button>
            </article>`;
    }).join('');

    el.innerHTML = `
        <div class="cart-layout">
            <div class="cart-items">${rows}</div>
            <aside class="checkout-box">
                <h2>ملخص الطلب</h2>
                <p>الإجمالي <strong>${total.toFixed(2)} د.ل</strong></p>
                <form id="checkout-form">
                    <label>الاسم
                        <input name="customer_name" required placeholder="اسمك الكامل">
                    </label>
                    <label>رقم الهاتف
                        <input name="phone" required type="tel" placeholder="رقم الهاتف">
                    </label>
                    <label>العنوان
                        <textarea name="address" required rows="2" placeholder="المدينة والمنطقة"></textarea>
                    </label>
                    <button class="btn full" type="submit">تأكيد الطلب</button>
                </form>
                <small class="muted">سيتم إعداد حفظ الطلبات في قاعدة البيانات.</small>
            </aside>
        </div>`;
}

// تأكيد الطلب: حفظ الطلبات في SQL يحتاج API خاص بالطلبات
async function submitOrder(e) {
    e.preventDefault();
    toast('المنتجات مربوطة بقاعدة البيانات، وحفظ الطلبات بنربطوه في الخطوة القادمة.');
}

document.addEventListener('click', e => {
    const a = e.target.closest('[data-add]');
    if (a) addProduct(a.dataset.add);

    const q = e.target.closest('[data-qty]');

    if (q) {
        const c = getCart();
        const id = Number(q.dataset.qty);
        const item = c.find(x => x.id === id);

        if (item) {
            item.qty += Number(q.dataset.change);
            saveCart(c.filter(x => x.qty > 0));
            renderCart();
        }
    }

    const r = e.target.closest('[data-remove]');

    if (r) {
        saveCart(getCart().filter(x => x.id !== Number(r.dataset.remove)));
        renderCart();
    }
});

document.addEventListener('submit', e => {
    if (e.target.id === 'checkout-form') {
        submitOrder(e);
    }
});

document.querySelector('.menu-toggle')?.addEventListener('click', () => {
    $('.nav')?.classList.toggle('open');
});

updateCount();
initFilters();

if ($('#show-routine')) {
    $('#show-routine').addEventListener('click', () => {
        renderRoutine($('#skin-type').value);
    });

    const t = new URLSearchParams(location.search).get('type');

    if (t && routines[t]) {
        $('#skin-type').value = t;
    }

    renderRoutine($('#skin-type').value);
}

loadProducts();