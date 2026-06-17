import { getWorkingHours } from "./actions";
import WorkingHoursClient from "./WorkingHoursClient";

export default async function HoursPage() {
  const { data } = await getWorkingHours();

  return <WorkingHoursClient hours={data} />;
}
