// শুধুমাত্র Toast দেখানোর লজিক। toggleMenu() এখান থেকে মুছে দিয়েছি কারণ সেটা global.js এ আছে।
function showToast() {
  const toast = document.getElementById('premium-toast');
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}