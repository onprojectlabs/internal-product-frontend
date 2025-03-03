import { useState, useEffect } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
    // Estado para almacenar nuestro valor
    // Pasa una función para que solo se ejecute una vez
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.log(error);
            return initialValue;
        }
    });

    // Retorna una versión envuelta de useState's setter function
    // que persiste el nuevo valor en localStorage
    const setValue = (value: T | ((val: T) => T)) => {
        try {
            // Permite que value sea una función para que tengamos la misma API que useState
            const valueToStore =
                value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.log(error);
        }
    };

    return [storedValue, setValue] as const;
}
