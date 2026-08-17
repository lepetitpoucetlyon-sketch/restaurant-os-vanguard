'use client';

import React, { useState, useEffect } from 'react';
import type { ContractRecord, VerticalType } from '@/modules/compliance';

import { MCCStatsCards } from './contracts/MCCStatsCards';
import { MCCContractsTable } from './contracts/MCCContractsTable';
import { MCCConsultModal } from './contracts/MCCConsultModal';
import { MCCCreateContractModal } from './contracts/MCCCreateContractModal';

export function MCCContractManager() {
  const [contracts, setContracts] = useState<ContractRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<ContractRecord | null>(null);

  // Form State
  const [tenantId, setTenantId] = useState('bistro-paris-01');
  const [vertical, setVertical] = useState<VerticalType>('RESTAURANT');
  const [companyName, setCompanyName] = useState('Le Petit Bistrot SAS');
  const [legalForm, setLegalForm] = useState('SAS');
  const [siren, setSiren] = useState('883 992 110');
  const [representativeName, setRepresentativeName] = useState('Jean Dupont');
  const [representativeRole, setRepresentativeRole] = useState('Gérant');
  const [email, setEmail] = useState('contact@lepetitbistrot.fr');
  const [address, setAddress] = useState('14 Rue de la Paix');
  const [postalCode, setPostalCode] = useState('75002');
  const [city, setCity] = useState('Paris');
  const [planName, setPlanName] = useState('Empire Pro');
  const [monthlyPrice, setMonthlyPrice] = useState(149);
  const [setupFee, setSetupFee] = useState(290);
  const [commitmentMonths, setCommitmentMonths] = useState(12);

  const fetchContracts = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/mcc/contracts');
      if (res.ok) {
        const data = await res.json();
        setContracts(data.contracts || []);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        tenantId,
        vertical,
        client: {
          companyName,
          legalForm,
          siren,
          representativeName,
          representativeRole,
          email,
          address,
          city,
          postalCode,
        },
        pricing: {
          planName,
          monthlyPriceInEuros: Number(monthlyPrice),
          setupFeeInEuros: Number(setupFee),
          commitmentMonths: Number(commitmentMonths),
          billingCycle: 'MONTHLY',
          includedRegistersCount: 2,
          includedModules: ['POS', 'KDS', 'INVENTORY', 'HACCP', 'DELIVERY_BRIDGE'],
        },
      };

      const res = await fetch('/api/mcc/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsCreateModalOpen(false);
        await fetchContracts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredContracts = contracts.filter(
    (c) =>
      c.client.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tenantId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <MCCStatsCards
        contracts={contracts}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
      />

      <MCCContractsTable
        filteredContracts={filteredContracts}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSelectContract={setSelectedContract}
      />

      <MCCConsultModal
        selectedContract={selectedContract}
        onClose={() => setSelectedContract(null)}
      />

      <MCCCreateContractModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateContract}
        tenantId={tenantId}
        setTenantId={setTenantId}
        vertical={vertical}
        setVertical={setVertical}
        companyName={companyName}
        setCompanyName={setCompanyName}
        legalForm={legalForm}
        setLegalForm={setLegalForm}
        siren={siren}
        setSiren={setSiren}
        representativeName={representativeName}
        setRepresentativeName={setRepresentativeName}
        representativeRole={representativeRole}
        setRepresentativeRole={setRepresentativeRole}
        email={email}
        setEmail={setEmail}
        monthlyPrice={monthlyPrice}
        setMonthlyPrice={setMonthlyPrice}
        setupFee={setupFee}
        setSetupFee={setSetupFee}
        commitmentMonths={commitmentMonths}
        setCommitmentMonths={setCommitmentMonths}
      />
    </div>
  );
}
