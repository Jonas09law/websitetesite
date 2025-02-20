(function() {
    document.addEventListener('contextmenu', (e) => e.preventDefault());

    document.addEventListener('keydown', (e) => {
        if (
            (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) ||
            (e.keyCode === 123)
        ) {
            e.preventDefault();
        }
        
        if (e.ctrlKey && e.keyCode === 85) {
            e.preventDefault();
        }

        if (e.ctrlKey && e.keyCode === 83) {
            e.preventDefault();
        }
    });


    let devtools = function() {};
    devtools.toString = function() {
        hideCode();
        return '';
    }

    setInterval(function() {
        const widthThreshold = window.outerWidth - window.innerWidth > 160;
        const heightThreshold = window.outerHeight - window.innerHeight > 160;
        
        if (widthThreshold || heightThreshold) {
            hideCode();
        }
    }, 1000);


    function hideCode() {
        document.querySelectorAll('script').forEach(s => s.remove());
        
        document.body.innerHTML = document.body.innerHTML
            .split('')
            .map(() => String.fromCharCode(Math.floor(Math.random() * 26) + 97))
            .join('');
        
        setTimeout(() => {
            window.location.href = '/';
        }, 500);
    }


    document.addEventListener('selectstart', (e) => e.preventDefault());

    document.addEventListener('dragstart', (e) => e.preventDefault());


    const _0x5a2b = ['log', 'warn', 'info', 'error', 'exception', 'table', 'trace'];
    for (let i = 0; i < _0x5a2b.length; i++) {
        console[_0x5a2b[i]] = function() {};
    }
})(); 