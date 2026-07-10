import PagePlaceholder from "../components/PagePlaceholder";
import AdminSidebar from "../components/sidebars/AdminSidebar";

export default function AdminButirSoal() {
  return <PagePlaceholder title="Butir Soal" description="Kelola butir soal per ujian (Tambah, Edit, Hapus soal)" sidebar={AdminSidebar} />;
}
