import PagePlaceholder from "../components/PagePlaceholder";
import AdminSidebar from "../components/sidebars/AdminSidebar";

export default function AdminHasil() {
  return <PagePlaceholder title="Hasil Ujian" description="Lihat dan koreksi hasil ujian siswa" sidebar={AdminSidebar} />;
}
