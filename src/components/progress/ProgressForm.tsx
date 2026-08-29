import { useState, FormEvent } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ProgressRecord, Metric } from '../../types';

interface ProgressFormProps {
  record: ProgressRecord | null;
  onClose: () => void;
}

interface MetricForm {
  id: string;
  name: string;
  value: number;
  unit: string;
  targetValue: number;
  previousValue: number;
  category: Metric['category'];
}

export function ProgressForm({ record, onClose }: ProgressFormProps) {
  const { patients, addProgressRecord, updateProgressRecord, progressRecords, currentTherapist } = useApp();
  const [form, setForm] = useState(() => ({
    patientId: record?.patientId || '',
    date: record?.date || new Date().toISOString().split('T')[0],
    painLevel: record?.painLevel || 5,
    mobilityScore: record?.mobilityScore || 50,
    strengthScore: record?.strengthScore || 50,
    functionalScore: record?.functionalScore || 50,
    notes: record?.notes || '',
  }));
  const [metrics, setMetrics] = useState<MetricForm[]>(
    record?.metrics.map(m => ({
      id: m.id,
      name: m.name,
      value: m.value,
      unit: m.unit,
      targetValue: m.targetValue || 0,
      previousValue: m.previousValue || 0,
      category: m.category,
    })) || []
  );
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'painLevel' || name === 'mobilityScore' || name === 'strengthScore' || name === 'functionalScore') {
      setForm(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleMetricChange = (index: number, field: string, value: string | number) => {
    setMetrics(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m));
  };

  const addMetric = () => {
    setMetrics(prev => [...prev, {
      id: `m-${Date.now()}`,
      name: '',
      value: 0,
      unit: 'grados',
      targetValue: 0,
      previousValue: 0,
      category: 'rom',
    }]);
  };

  const removeMetric = (index: number) => {
    setMetrics(prev => prev.filter((_, i) => i !== index));
  };

  const handlePatientSelect = (patientId: string) => {
    setForm(prev => ({ ...prev, patientId }));

    const existingRecords = progressRecords
      .filter(r => r.patientId === patientId)
      .sort((a, b) => b.date.localeCompare(a.date));

    if (existingRecords.length > 0) {
      const latest = existingRecords[0];
      setForm(prev => ({
        ...prev,
        patientId,
        painLevel: latest.painLevel,
        mobilityScore: latest.mobilityScore,
        strengthScore: latest.strengthScore,
        functionalScore: latest.functionalScore,
      }));
      const metricPreloads = latest.metrics.map(m => ({
        id: `m-${Date.now()}-${m.name.replace(/\s/g, '-')}`,
        name: m.name,
        value: m.value,
        unit: m.unit,
        targetValue: m.targetValue || 0,
        previousValue: m.value,
        category: m.category,
      }));
      if (metrics.length === 0) {
        setMetrics(metricPreloads);
      }
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.patientId) {
      setError('Selecciona un paciente');
      return;
    }

    const patient = patients.find(p => p.id === form.patientId);

    const validMetrics: Metric[] = metrics
      .filter(m => m.name.trim())
      .map(m => ({
        id: m.id,
        name: m.name,
        value: m.value,
        unit: m.unit || 'unidades',
        targetValue: m.targetValue || undefined,
        previousValue: m.previousValue || undefined,
        category: m.category,
      }));

    const recordData = {
      patientId: form.patientId,
      patientName: patient ? `${patient.firstName} ${patient.lastName}` : '',
      therapistId: currentTherapist.id,
      therapistName: currentTherapist.name,
      date: form.date,
      metrics: validMetrics,
      painLevel: form.painLevel,
      mobilityScore: form.mobilityScore,
      strengthScore: form.strengthScore,
      functionalScore: form.functionalScore,
      notes: form.notes,
    };

    if (record) {
      updateProgressRecord(record.id, recordData);
    } else {
      addProgressRecord(recordData);
    }
    onClose();
  };

  const inputClass = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  const sliderStyle = "w-full accent-primary h-2";

  return (
    <Modal isOpen onClose={onClose} title={record ? 'Editar Registro de Progreso' : 'Nuevo Registro de Progreso'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="p-3 bg-danger-light border border-danger text-danger rounded-lg text-sm">{error}</div>}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-1">
            <label className={labelClass}>Paciente *</label>
            <select
              className={inputClass}
              value={form.patientId}
              onChange={(e) => handlePatientSelect(e.target.value)}
            >
              <option value="">Selecciona un paciente...</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Fecha</label>
            <input name="date" type="date" className={inputClass} value={form.date} onChange={handleChange} />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 text-primary">Evaluación Clínica</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nivel de dolor: <strong className="text-danger">{form.painLevel}/10</strong></label>
              <input
                type="range"
                min="0"
                max="10"
                className={sliderStyle}
                name="painLevel"
                value={form.painLevel}
                onChange={handleChange}
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>Sin dolor</span>
                <span>Insoportable</span>
              </div>
            </div>
            <div>
              <label className={labelClass}>Movilidad: <strong className="text-primary">{form.mobilityScore}%</strong></label>
              <input
                type="range"
                min="0"
                max="100"
                className={sliderStyle}
                name="mobilityScore"
                value={form.mobilityScore}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className={labelClass}>Fuerza: <strong className="text-secondary-dark">{form.strengthScore}%</strong></label>
              <input
                type="range"
                min="0"
                max="100"
                className={sliderStyle}
                name="strengthScore"
                value={form.strengthScore}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className={labelClass}>Funcional: <strong className="text-clay">{form.functionalScore}%</strong></label>
              <input
                type="range"
                min="0"
                max="100"
                className={sliderStyle}
                name="functionalScore"
                value={form.functionalScore}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 text-primary">Métricas y Medidas</h3>
            <button
              type="button"
              onClick={addMetric}
              className="text-sm text-primary hover:text-primary font-medium flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Agregar métrica
            </button>
          </div>

          {metrics.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6 bg-gray-50 rounded-lg">
              Agrega métricas como rango de movimiento, fuerza, etc.
            </p>
          ) : (
            <div className="space-y-3">
              {metrics.map((m, index) => (
                <div key={m.id} className="p-3 border border-gray-200 rounded-lg grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Métrica</label>
                    <input
                      className={inputClass}
                      value={m.name}
                      onChange={(e) => handleMetricChange(index, 'name', e.target.value)}
                      placeholder="Ej: Flexión de hombro"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Valor</label>
                    <input
                      type="number"
                      className={inputClass}
                      value={m.value}
                      onChange={(e) => handleMetricChange(index, 'value', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Unidad</label>
                    <input
                      className={inputClass}
                      value={m.unit}
                      onChange={(e) => handleMetricChange(index, 'unit', e.target.value)}
                      placeholder="grados"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Categoría</label>
                    <select
                      className={inputClass}
                      value={m.category}
                      onChange={(e) => handleMetricChange(index, 'category', e.target.value)}
                    >
                      <option value="rom">Rango de movimiento</option>
                      <option value="strength">Fuerza</option>
                      <option value="pain">Dolor</option>
                      <option value="functional">Funcional</option>
                      <option value="other">Otro</option>
                    </select>
                  </div>
                  {m.category === 'rom' && (
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Valor objetivo</label>
                      <input
                        type="number"
                        className={inputClass}
                        value={m.targetValue}
                        onChange={(e) => handleMetricChange(index, 'targetValue', parseInt(e.target.value) || 0)}
                      />
                    </div>
                  )}
                  <div className="sm:col-span-2 flex items-end">
                    <button
                      type="button"
                      onClick={() => removeMetric(index)}
                      className="text-danger hover:text-danger-hover text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className={labelClass}>Notas clínicas</label>
          <textarea
            name="notes"
            rows={4}
            className={inputClass}
            value={form.notes}
            onChange={handleChange}
            placeholder="Describe la evolución del paciente, observaciones, recomendaciones..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit">{record ? 'Guardar Cambios' : 'Registrar Progreso'}</Button>
        </div>
      </form>
    </Modal>
  );
}