'use client'

export type Filters = {
  selectedYear?: number;
  selectedCargo?: number | null;
  selectedMunicipio?: number | null;
  candidateSearch?: string;
};

import { useState, useEffect } from "react";
import { SelectDashboard } from "@/components/SelectDashboard";
import DashboardVisaoGeralEleicoes from "@/components/dashboards/DashboardVisaoGeralEleicoes";
import DashboardFilters from "@/components/dashboard-filters";
import DashboardVisaoGeralIndividual from "@/components/dashboards/DashboardVisaoIndividual";
import DashboardComparativoCandidatos from "@/components/dashboards/DashboardComparativoCandidatos";
// import DashboardAutoComparativo from "@/components/dashboards/DashboardAutoComparativo";

const DashboardPage = () => {
    const [selectedDashboard, setSelectedDashboard] = useState("visaoGeralEleicoes");

    const [filters, setFilters] = useState<Filters>({
        selectedYear: 2022, // Set default year
        selectedCargo: null,
        selectedMunicipio: null, // Initialize selectedMunicipio
        
    });

    useEffect(() => {
        if (selectedDashboard === "visaoGeralEleicoes") {
            setFilters((prevFilters) => ({
                ...prevFilters
            }));
        }
    }, [selectedDashboard]);

    const handleFilterChange = (newFilters: Filters) => {
        setFilters(newFilters);
    };

    const renderDashboard = () => {
        console.log('Current filters:', filters); // Add debug logging
        switch (selectedDashboard) {
            case "visaoGeralEleicoes":
                return <DashboardVisaoGeralEleicoes filters={filters} />;
            case "visaoGeralIndividual":
                return <DashboardVisaoGeralIndividual filters={filters} />; // Pass filters prop
            case "comparativoCandidatos":
                return <DashboardComparativoCandidatos filters={filters} />; // Add filters prop here
//            case "autoComparativo":
//                return <DashboardAutoComparativo />;
            default:
                return <DashboardVisaoGeralEleicoes filters={filters} />;
        }
    };

    return (
        <>
        <div className="p-4 w-full">
        <div className="mb-4 flex flex-row justify-between">
          <div>
            <h1 className="text-xl font-mono">Dashboards</h1>
            <h1 className="text-4xl font-bold"> {selectedDashboard === "visaoGeralEleicoes" && "Visão Geral das Eleições"}
            {selectedDashboard === "visaoGeralIndividual" && "Visão Geral Individual"}
             {selectedDashboard === "comparativoCandidatos" && "Comparativo de Candidatos"}
             {selectedDashboard === "autoComparativo" && "Auto Comparativo"}
            </h1>
        </div>
        <div>
          <SelectDashboard onChange={(value) => setSelectedDashboard(value)} />
        </div>
      </div><div className="flex mb-4"></div><DashboardFilters onChange={handleFilterChange} selectedDashboard={selectedDashboard} /> {/* Add selectedDashboard prop */}
          <div>
            {renderDashboard()}
          </div>
        </div>
        </>
      );
}

export default DashboardPage;