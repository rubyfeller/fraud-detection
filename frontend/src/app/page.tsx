import DashboardLayout from "@/components/DashboardLayout";
import FraudDashboard from "@/components/FraudDashboard";

export default function Page() {
    return (
        <DashboardLayout>
            <FraudDashboard/>
        </DashboardLayout>
    )
}