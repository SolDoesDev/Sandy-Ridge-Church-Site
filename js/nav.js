// Sandy Ridge Church — shared nav behavior (mobile menu toggle)
document.addEventListener('DOMContentLoaded', function () {
  var burger = document.querySelector('.nav-burger');
  if (!burger) return;
  burger.addEventListener('click', function () {
    document.body.classList.toggle('nav-open');
  });
});
