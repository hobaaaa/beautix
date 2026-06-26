import { StaffClient } from "./StaffClient";
import { getStaffPageData } from "./queries";

export default async function StaffPage() {
  const { staff, services } = await getStaffPageData();

  return <StaffClient staff={staff} services={services} />;
}
