<link rel="icon" type="image/png" href="../assets/images/icon.png" />
<link href="../assets/bootstrap-5.3.6/css/bootstrap.min.css" rel="stylesheet">
<link href="../assets/fontawesome/css/all.min.css" rel="stylesheet">
<link href="../assets/adminkit/static/css/app.css" rel="stylesheet">
<link href="../assets/datatables/datatables.css" rel="stylesheet">
<style>
  /* Toast Notifications */
  #toast-container {
    position: fixed !important;
    bottom: 1rem;
    right: 1rem;
    left: auto !important;
    z-index: 9999;
  }

  /* FontAwesome Animations */
  .fa-beat, .fa-bounce, .fa-fade, .fa-beat-fade, .fa-flip, .fa-pulse, .fa-shake, .fa-spin, .fa-spin-pulse {
    animation-duration: 2s;
    animation-iteration-count: infinite;
  }

  /* Table Styles */
  .table-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    border-radius: 0.5rem;
    box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  }

  table th, table td {
    text-align: left !important;
    vertical-align: middle !important;
    padding: 0.75rem 1rem !important;
  }

  /* Blinking Animation */
  .blinking {
    animation: blink 1s infinite;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }

  /* Sidebar Submenu Styles */
  li.sidebar-item.submenu > a.sidebar-link {
    background: linear-gradient(to left, #222e3c, #3a4d63) !important;
    border-bottom: 2px solid #222e3c;
  }

  /* Global Layout Improvements */
  .main {
    background-color: #f8f9fa;
    min-height: 100vh;
  }

  .content {
    padding: 2rem 0;
  }

  /* Card Improvements */
  .card {
    border: none;
    border-radius: 0.75rem;
    box-shadow: 0 0.25rem 1rem rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;
  }

  .card:hover {
    box-shadow: 0 0.5rem 2rem rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
  }

  .card-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 0.75rem 0.75rem 0 0 !important;
    border-bottom: none;
    padding: 1.5rem;
  }

  .card-header h5 {
    margin: 0;
    font-weight: 600;
    font-size: 1.25rem;
  }

  .card-body {
    padding: 2rem;
  }

  /* Button Improvements */
  .btn {
    border-radius: 0.5rem;
    font-weight: 500;
    transition: all 0.3s ease;
  }

  .btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }

  /* Form Improvements */
  .form-control {
    border-radius: 0.5rem;
    border: 1px solid #ced4da;
    transition: all 0.3s ease;
  }

  .form-control:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
  }

  /* Footer Copyright */
  .footer-copyright {
    background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
    color: white;
    text-align: center;
    padding: 1.5rem 0;
    margin-top: auto;
    border-top: 3px solid #667eea;
  }

  .footer-copyright p {
    margin: 0;
    font-size: 0.9rem;
    opacity: 0.9;
  }

  /* Responsive Improvements */
  @media (max-width: 768px) {
    .content {
      padding: 1rem 0;
    }

    .card-body {
      padding: 1.5rem;
    }

    .card-header {
      padding: 1rem;
    }

    .card-header h5 {
      font-size: 1.1rem;
    }

    .footer-copyright {
      padding: 1rem 0;
    }

    .footer-copyright p {
      font-size: 0.8rem;
    }
  }

  /* Loading States */
  .loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
  }

  .spinner-border {
    width: 3rem;
    height: 3rem;
  }

  /* Alert Improvements */
  .alert {
    border-radius: 0.5rem;
    border: none;
  }

  /* Badge Improvements */
  .badge {
    font-weight: 500;
    border-radius: 0.375rem;
  }

  /* Modal Improvements */
  .modal-content {
    border-radius: 0.75rem;
    border: none;
    box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.175);
  }

  .modal-header {
    border-radius: 0.75rem 0.75rem 0 0;
    border-bottom: 1px solid #dee2e6;
  }

  /* Sidebar Logo Improvements */
  .sidebar-logo {
    border-radius: 0.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
</style>
<!--<style>
#soal.sidebar-dropdown a {
    background-color: rgba(0, 0, 0, 0.15); /* Warna gelap dengan transparansi */
    padding: 10px 25px;
    margin-top: -1px; /* Untuk menghilangkan gap */
}
</style>-->
