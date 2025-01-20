'use client'

type Filters = {
    selectedYear: string | null;
    selectedView: string;
    selectedCargo: string | null;
};

import { useState } from "react";
import { SelectDashboard } from "@/components/SelectDashboard";
import DashboardVisaoGeralEleicoes from "@/components/dashboards/DashboardVisaoGeralEleicoes";
import DashboardFilters from "@/components/dashboard-filters";

//import DashboardVisaoGeralIndividual from "@/components/dashboards/DashboardVisaoGeralIndividual";
// import DashboardComparativoCandidatos from "@/components/dashboards/DashboardComparativoCandidatos";
// import DashboardAutoComparativo from "@/components/dashboards/DashboardAutoComparativo";

export default function Dashboard() {
    const [selectedDashboard, setSelectedDashboard] = useState("visaoGeralEleicoes");

    const [filters, setFilters] = useState<Filters>({
        selectedYear: null,
        selectedView: 'Votos totais',
        selectedCargo: null,
      });
      
      const handleFilterChange = (newFilters: Filters) => {
        setFilters(newFilters);
      };

    const renderDashboard = () => {
        switch (selectedDashboard) {
            case "visaoGeralEleicoes":
                return <DashboardVisaoGeralEleicoes filters={filters} />;
//            case "visaoGeralIndividual":
//                return <DashboardVisaoGeralIndividual />;
//            case "comparativoCandidatos":
//                return <DashboardComparativoCandidatos />;
//            case "autoComparativo":
//                return <DashboardAutoComparativo />;
            default:
                return <DashboardVisaoGeralEleicoes filters={filters} />;
        }
    };

    return (
        <div className="p-4 w-full">
          <div className="mb-4 flex flex-row justify-between">
            <div>
              <h1 className="text-4xl font-bold">Dashboard</h1>
            </div>
            <div>
              <SelectDashboard onChange={(value) => setSelectedDashboard(value)} />
            </div>
          </div>
          <div className="flex mb-4">
            <DashboardFilters onChange={handleFilterChange} />
          </div>
          <div>
            {renderDashboard()}
          </div>
        </div>
      );
}