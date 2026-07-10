import PagePlaceholder from "../components/PagePlaceholder";
import GuruSidebar from "../components/sidebars/GuruSidebar";

export default function GuruHasil() {
  return <PagePlaceholder title="Hasil Ujian" description="Lihat hasil ujian dan koreksi uraian" sidebar={GuruSidebar} />;
}
