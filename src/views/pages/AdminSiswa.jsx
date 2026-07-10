import PagePlaceholder from "../components/PagePlaceholder";
import AdminSidebar from "../components/sidebars/AdminSidebar";

export default function AdminSiswa() {
  return <PagePlaceholder title="Manajemen Siswa" description="Kelola data siswa (Tambah, Edit, Import, Hapus siswa)" sidebar={AdminSidebar} />;
}
