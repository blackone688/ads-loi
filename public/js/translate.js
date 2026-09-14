<script>
(function () {
    const LANG_MAP = {
        // English
        'US': 'en', 'GB': 'en', 'CA': 'en', 'AU': 'en', 'NZ': 'en', 'IE': 'en', 'SG': 'en',

        // Asia
        'JP': 'ja', 'KR': 'ko', 'CN': 'zh-CN', 'TW': 'zh-TW', 'HK': 'zh-TW',
        'TH': 'th', 'ID': 'id', 'MY': 'ms', 'PH': 'tl', 'IN': 'hi',
        'PK': 'ur', 'BD': 'bn',
        'VN': 'vi',   // ← THÊM VIỆT NAM
        'KH': 'km', 'LA': 'lo', 'MM': 'my', 'NP': 'ne', 'LK': 'si',

        // Europe major
        'FR': 'fr', 'DE': 'de', 'IT': 'it', 'ES': 'es', 'PT': 'pt',
        'NL': 'nl', 'BE': 'fr', 'CH': 'de', 'AT': 'de',

        // Scandinavia
        'SE': 'sv', 'NO': 'no', 'DK': 'da', 'FI': 'fi', 'IS': 'is',

        // Eastern Europe
        'PL': 'pl', 'CZ': 'cs', 'SK': 'sk', 'HU': 'hu', 'RO': 'ro',
        'BG': 'bg', 'HR': 'hr', 'SI': 'sl', 'RS': 'sr', 'BA': 'bs',
        'ME': 'sr', 'MK': 'mk',

        // Baltic
        'LT': 'lt', 'LV': 'lv', 'EE': 'et',

        // Southern Europe
        'GR': 'el', 'AL': 'sq',

        // Middle East
        'SA': 'ar', 'AE': 'ar', 'EG': 'ar', 'IQ': 'ar', 'MA': 'ar',
        'IL': 'he', 'IR': 'fa', 'AF': 'fa', 'TR': 'tr',

        // Latin America
        'MX': 'es', 'AR': 'es', 'CO': 'es', 'CL': 'es', 'PE': 'es',
        'VE': 'es', 'UY': 'es', 'PY': 'es', 'BO': 'es', 'EC': 'es',

        // Brazil
        'BR': 'pt',

        // Africa
        'ZA': 'en', 'NG': 'en', 'KE': 'en',

        // Ukraine / Russia
        'UA': 'uk', 'RU': 'ru',
    };

    // ── Overlay ──────────────────────────────────────────────────────────
    var overlay = document.createElement('div');
    overlay.id = 'translate-overlay';
    overlay.style.cssText = [
        'position:fixed', 'inset:0', 'z-index:999999',
        'background:rgba(255,255,255,0.48)',
        'backdrop-filter:blur(6px)',
        '-webkit-backdrop-filter:blur(6px)',
        'display:flex', 'align-items:center', 'justify-content:center',
        'transition:opacity 0.4s ease', 'opacity:1',
    ].join(';');

    var spinner = document.createElement('div');
    spinner.style.cssText = [
        'width:36px', 'height:36px',
        'border:3px solid #e0e0e0',
        'border-top-color:#1877f2',
        'border-radius:50%',
        'animation:_tl_spin 0.7s linear infinite',
    ].join(';');

    var style = document.createElement('style');
    style.textContent = '@keyframes _tl_spin{to{transform:rotate(360deg)}}';
    document.head.appendChild(style);
    overlay.appendChild(spinner);

    if (document.body) document.body.appendChild(overlay);
    else document.addEventListener('DOMContentLoaded', function () {
        document.body.appendChild(overlay);
    });

    function removeOverlay() {
        overlay.style.opacity = '0';
        setTimeout(function () {
            overlay.parentNode && overlay.parentNode.removeChild(overlay);
        }, 420);
    }

    // ── Helpers ───────────────────────────────────────────────────────────
    function getGoogtransCookie() {
        var m = document.cookie.match(/(?:^|;\s*)googtrans=([^;]*)/);
        return m ? decodeURIComponent(m[1]) : null;
    }

    function setGoogtransCookie(lang) {
        var value = '/en/' + lang;
        var hostname = location.hostname;
        document.cookie = 'googtrans=' + value + '; path=/';
        if (hostname && hostname !== 'localhost') {
            document.cookie = 'googtrans=' + value + '; path=/; domain=' + hostname;
            document.cookie = 'googtrans=' + value + '; path=/; domain=.' + hostname;
        }
    }

    // ── Inject Google Translate widget (BẮT BUỘC) ──────────────────────
    function injectGoogleTranslateWidget() {
        if (document.getElementById('google_translate_element')) return;

        var holder = document.createElement('div');
        holder.id = 'google_translate_element';
        // Ẩn widget đi, chỉ dùng để kích hoạt dịch
        holder.style.cssText = 'position:absolute;left:-9999px;top:-9999px;';
        (document.body || document.documentElement).appendChild(holder);

        window.googleTranslateElementInit = function () {
            new google.translate.TranslateElement({
                pageLanguage: 'en',
                autoDisplay: false,
                layout: google.translate.TranslateElement.InlineLayout.SIMPLE
            }, 'google_translate_element');
        };

        var s = document.createElement('script');
        s.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        s.async = true;
        document.head.appendChild(s);
    }

    // ── Detect country (có fallback) ─────────────────────────────────────
    async function getCountryCode() {
        // API 1: ipinfo
        try {
            var r = await fetch('https://ipinfo.io/json?token=5a58a2d85996e3');
            var d = await r.json();
            if (d && d.country) return d.country.toUpperCase();
        } catch (e) {}

        // API 2: ipapi.co (miễn phí, không cần token)
        try {
            var r2 = await fetch('https://ipapi.co/json/');
            var d2 = await r2.json();
            if (d2 && d2.country_code) return d2.country_code.toUpperCase();
        } catch (e) {}

        // API 3: cloudflare trace
        try {
            var r3 = await fetch('https://www.cloudflare.com/cdn-cgi/trace');
            var t = await r3.text();
            var m = t.match(/loc=([A-Z]{2})/);
            if (m) return m[1];
        } catch (e) {}

        return '';
    }

    // ── Wait for Google Translate to finish ────────────────────────────
    function waitForTranslation(timeout) {
        return new Promise(function (resolve) {
            var html = document.documentElement;
            if (/translated-(ltr|rtl)/.test(html.className)) return resolve();
            var timer = setTimeout(resolve, timeout || 6000);
            var obs = new MutationObserver(function () {
                if (/translated-(ltr|rtl)/.test(html.className)) {
                    clearTimeout(timer);
                    obs.disconnect();
                    resolve();
                }
            });
            obs.observe(html, { attributes: true, attributeFilter: ['class'] });
        });
    }

    // ── Main ──────────────────────────────────────────────────────────────
    async function run() {
        // Luôn inject widget để Google Translate có thể hoạt động
        injectGoogleTranslateWidget();

        var existing = getGoogtransCookie();
        var isEnglishCookie = !existing
            || existing === '/en/en'
            || existing === '/en/'
            || existing === '/en/undefined';

        if (!isEnglishCookie) {
            // Đã có cookie ngôn ngữ → chờ dịch xong rồi ẩn overlay
            await waitForTranslation(6000);
            removeOverlay();
            return;
        }

        // Lần đầu: phát hiện quốc gia
        var countryCode = await getCountryCode();
        var targetLang = countryCode ? LANG_MAP[countryCode] : null;

        if (!targetLang || targetLang === 'en') {
            if (targetLang === 'en') setGoogtransCookie('en');
            removeOverlay();
            return;
        }

        setGoogtransCookie(targetLang);
        location.reload();
    }

    if (document.body) run();
    else document.addEventListener('DOMContentLoaded', run);
})();
</script>
