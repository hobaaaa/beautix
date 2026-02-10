import { getServices } from "./actions";
import { ServiceClient } from "./ServiceClient";

export default async function ServicesPage() {
  const { data: services } = await getServices();

  return <ServiceClient services={services} />;
}
