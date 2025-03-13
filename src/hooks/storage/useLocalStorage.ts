import { useState, useEffect } from 'react';

interface Options<T> {
  serialize?: (value: T) => string;
  deserialize?: (value: string) => T;
}

export function useLocalStorage<T>(
  key: string, 
  initialValue: T,
  options: Options<T> = {}
) {
  const {
    serialize = JSON.stringify,
    deserialize = JSON.parse,
  } = options;

  // Estado para almacenar nuestro valor
  // Pasa una función para useState así la lógica se ejecuta una sola vez
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      console.log(`[useLocalStorage] Intentando cargar ${key}:`, item);
      const value = item ? deserialize(item) : initialValue;
      console.log(`[useLocalStorage] Valor cargado ${key}:`, value);
      return value;
    } catch (error) {
      console.error(`[useLocalStorage] Error cargando ${key}:`, error);
      return initialValue;
    }
  });

  // Retorna una versión envuelta de la función useState's setter que persiste
  // el nuevo valor a localStorage.
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Permite que el value sea una función para que tengamos la misma API que useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Guardar en el estado
      setStoredValue(valueToStore);
      
      // Guardar en localStorage
      const serialized = serialize(valueToStore);
      console.log(`Guardando en localStorage (${key}):`, serialized);
      window.localStorage.setItem(key, serialized);
      
      // Verificar que se guardó
      const stored = window.localStorage.getItem(key);
      console.log(`Verificando localStorage (${key}):`, stored);
    } catch (error) {
      console.error('Error al guardar en localStorage:', error);
    }
  };

  return [storedValue, setValue] as const;
} 