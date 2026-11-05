import { useEffect, useMemo, useState } from 'react';
import { createAdminOptionApi, fetchAdminOptionsApi } from '../../services/api';

const ADD_NEW_VALUE = '__sikhar_add_new_option__';

export default function AdminOptionSelect({ group, children, onChange, ...props }) {
  const [savedOptions, setSavedOptions] = useState([]);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let active = true;
    fetchAdminOptionsApi(group)
      .then(options => { if (active) setSavedOptions(options); })
      .catch(() => {});
    return () => { active = false; };
  }, [group]);

  const existingValues = useMemo(() => new Set(
    (Array.isArray(children) ? children : [children])
      .filter(child => child?.props?.value !== undefined)
      .map(child => String(child.props.value))
  ), [children]);

  const customOptions = savedOptions.filter(option => !existingValues.has(String(option.value)));

  const handleChange = async (event) => {
    if (event.target.value !== ADD_NEW_VALUE) {
      onChange?.(event);
      return;
    }

    const label = window.prompt('Enter the new option name:');
    if (!label?.trim()) return;

    setAdding(true);
    try {
      const option = await createAdminOptionApi(group, label.trim());
      setSavedOptions(current => [...current, option]);
      onChange?.({ ...event, target: { ...event.target, value: option.value } });
    } catch (error) {
      window.alert(error.message || 'The new option could not be saved.');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="admin-option-select-wrap">
      <select {...props} onChange={handleChange} disabled={props.disabled || adding}>
        {children}
        {customOptions.map(option => (
          <option key={`${group}-${option.value}`} value={option.value}>{option.label}</option>
        ))}
        <option value={ADD_NEW_VALUE}>＋ Add new option…</option>
      </select>
      {adding && <span className="admin-option-saving">Saving…</span>}
    </div>
  );
}
