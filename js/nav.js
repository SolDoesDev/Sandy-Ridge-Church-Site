// Mobile nav toggle + dropdown handling + active link state
document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.getElementById('nav-toggle');
  var nav = document.getElementById('nav-links');

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var isOpen = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  // Mobile: tapping the "About" link toggles its submenu instead of navigating
  var dropdownItem = document.querySelector('.nav-item--dropdown');
  if (dropdownItem) {
    var dropdownToggle = dropdownItem.querySelector('a');
    dropdownToggle.addEventListener('click', function (e) {
      if (window.innerWidth <= 1080) {
        e.preventDefault();
        dropdownItem.classList.toggle('open');
      }
    });
  }

  // Close mobile menu when a link is chosen
  var allNavLinks = document.querySelectorAll('.nav-links a');
  allNavLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      if (window.innerWidth <= 1080 && link !== (dropdownItem && dropdownItem.querySelector('a'))) {
        document.body.classList.remove('nav-open');
        if (toggle) toggle.setAttribute('aria-expanded', 'false');
      }
    });
  });

  // Active link highlighting
  var current = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a[href]').forEach(function (link) {
    var href = link.getAttribute('href');
    if (href === current) {
      link.classList.add('active');
    }
  });
});
