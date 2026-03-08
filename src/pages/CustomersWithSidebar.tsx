import { LayoutWithSidebar } from "@/components/LayoutWithSidebar";
import Customers from "./Customers";

const CustomersWithSidebar = () => {
  return (
    <LayoutWithSidebar>
      <Customers />
    </LayoutWithSidebar>
  );
};

export default CustomersWithSidebar;