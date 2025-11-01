document.addEventListener('DOMContentLoaded', () => {
  // Burger menu
  const burger = document.getElementById('burger');
  const sidebar = document.getElementById('sidebar');
  if (burger && sidebar) {
    burger.addEventListener('click', () => {
      sidebar.classList.toggle('active');
    });
  }

  // Carousel
  const carousel = document.querySelector('.carousel');
  const leftArrow = document.querySelector('.carousel-arrow.left');
  const rightArrow = document.querySelector('.carousel-arrow.right');

  if (carousel && leftArrow && rightArrow) {
    function getCardWidth() {
      const card = carousel.querySelector('.carte');
      const style = window.getComputedStyle(card);
      const marginRight = parseInt(style.marginRight) || 0;
      return card.offsetWidth + marginRight;
    }

    leftArrow.addEventListener('click', () => {
      carousel.scrollBy({ left: -getCardWidth(), behavior: 'smooth' });
    });

    rightArrow.addEventListener('click', () => {
      carousel.scrollBy({ left: getCardWidth(), behavior: 'smooth' });
    });
  }
});