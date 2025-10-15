# Revisión de Hugo

## ⚠️ Observaciones

> [!WARNING]
> - Tiene todo el código dentro del mismo archivo. Habría que crear 3 archivos separando el HTML, CSS y JS. ❌  
> - Sobra un `if` en la línea 44 del `main.js`. ❌  
> - Al crear el tablero añade 4 `addEventListener` por cada celda, se podría reducir ya que son 324.  
> - Aunque la funcionalidad sea correcta, se podría mejorar la legibilidad del código. ❌  

---

## 💡 Puntos positivos

> [!INFO]
> - El HTML y el CSS están bien estructurados. ✔  
> - El tablero se crea en tiempo de ejecución. ✔  
> - Tiene las siguientes funciones:
>   - Cargar sudoku ✔  
>   - Limpiar tablero ✔ (limpia también las posiciones fijas) ❌  
>   - Borrar celda ✔  
>   - Comprobar solución ✔  
>   - Rellenar candidatos ✔  
> - Panel de números para poner en el tablero ✔  
> - Muestra el estado actual ✔  
> - Marca si el número está repetido en la fila, columna o bloque ✔
