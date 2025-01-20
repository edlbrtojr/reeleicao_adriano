import * as React from "react";
import { useState, useCallback } from "react";
import { debounce } from "lodash";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SelectDashboardProps {
  onChange: (value: string) => void;
}

export function SelectDashboard({ onChange }: SelectDashboardProps) {
  const [value, setValue] = useState("");

  const debouncedOnChange = useCallback(
    debounce((value: string) => {
      onChange(value);
    }, 500),
    []
  );

  const handleChange = (value: string) => {
    setValue(value);
    debouncedOnChange(value);
  };

  return (
    <Select onValueChange={handleChange}>
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder="Selecione um Gráfico" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Modelos</SelectLabel>
          <SelectItem value="visaoGeralEleicoes">Visão Geral das Eleições</SelectItem>
          <SelectItem value="visaoGeralIndividual">Visão Geral Individual</SelectItem>
          <SelectItem value="comparativoCandidatos">Comparativo entre candidatos</SelectItem>
          <SelectItem value="autoComparativo">AutoComparativo</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}