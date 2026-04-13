  function toggleMenu() {
    const nav = document.getElementById('nav-links');
    nav.classList.toggle('active');
  }

  function showToast() {
    const toast = document.getElementById('premium-toast');
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }