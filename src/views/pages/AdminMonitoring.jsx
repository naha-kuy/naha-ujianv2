import PagePlaceholder from "../components/PagePlaceholder";
import AdminSidebar from "../components/sidebars/AdminSidebar";

export default function AdminMonitoring() {
  return <PagePlaceholder title="Monitoring Ujian" description="Pantau ujian yang sedang berlangsung secara real-time" sidebar={AdminSidebar} />;
}
