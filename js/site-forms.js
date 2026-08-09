/* ============================================================
   Contact / application forms.

   This is a static site: there is no backend to post to, and pretending
   otherwise ("Message sent!") would be a lie. So the mail path is the primary
   action — the button validates, then hands a pre-filled message to the
   visitor's own mail client and says plainly that nothing was transmitted by
   the page itself, with the plain address left in reach as a fallback.

   Markup contract:
     <form data-mailto="…" data-subject="…" data-status="#id">
     controls carry name/id/label, `required` where required,
     and an optional sibling <p class="field-error" id="…-error">.
   ============================================================ */
(function () {
    'use strict';

    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function labelFor(field, form) {
        var l = form.querySelector('label[for="' + field.id + '"]');
        return l ? l.textContent.trim() : (field.name || field.id);
    }

    function errorNode(field) {
        var id = field.getAttribute('aria-describedby');
        return id ? document.getElementById(id) : null;
    }

    function setError(field, message) {
        var node = errorNode(field);
        field.setAttribute('aria-invalid', message ? 'true' : 'false');
        if (!node) return;
        node.textContent = message || '';
        node.classList.toggle('is-visible', !!message);
    }

    function validate(field) {
        var v = (field.value || '').trim();
        if (field.required && !v) {
            return field.tagName === 'SELECT'
                ? 'Choose an option.'
                : 'This field is required.';
        }
        if (field.type === 'email' && v && !EMAIL_RE.test(v)) {
            return 'Enter a valid email address, e.g. name@university.edu.';
        }
        return '';
    }

    document.querySelectorAll('form[data-mailto]').forEach(function (form) {
        form.setAttribute('novalidate', 'novalidate');

        var fields = [].slice.call(
            form.querySelectorAll('input[name], select[name], textarea[name]'));
        var status = form.querySelector('.form-status');
        var address = form.getAttribute('data-mailto');

        fields.forEach(function (f) {
            // Only re-validate after the field has already been flagged, so the
            // first keystroke in an empty field is not met with an error.
            f.addEventListener('blur', function () {
                if (f.getAttribute('aria-invalid') === 'true') setError(f, validate(f));
            });
            f.addEventListener('input', function () {
                if (f.getAttribute('aria-invalid') === 'true') setError(f, validate(f));
            });
        });

        form.addEventListener('submit', function (e) {
            e.preventDefault();

            var firstBad = null;
            fields.forEach(function (f) {
                var msg = validate(f);
                setError(f, msg);
                if (msg && !firstBad) firstBad = f;
            });

            if (firstBad) {
                if (status) {
                    status.innerHTML =
                        '<strong>Nothing was sent.</strong> Please correct the ' +
                        'highlighted fields and try again.';
                    status.classList.add('is-visible');
                }
                firstBad.focus();
                return;
            }

            var body = fields.map(function (f) {
                return labelFor(f, form) + ':\n' + f.value.trim();
            }).join('\n\n');

            var href = 'mailto:' + address +
                '?subject=' + encodeURIComponent(form.getAttribute('data-subject') || '') +
                '&body=' + encodeURIComponent(body);

            if (status) {
                status.innerHTML =
                    '<strong>Your email client should now be open with this ' +
                    'message ready to send.</strong> This page has no server: ' +
                    'nothing has been transmitted yet, and the message only ' +
                    'reaches us once you send it yourself. If nothing opened, ' +
                    'write to <a href="mailto:' + address + '">' + address + '</a>.';
                status.classList.add('is-visible');
            }
            window.location.href = href;
        });
    });
})();
