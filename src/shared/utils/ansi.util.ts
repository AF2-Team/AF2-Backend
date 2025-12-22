/**
 * Interfaz para definir los tipos de estilos disponibles
 */
interface ANSIStyles {
    [key: string]: string;
}

/**
 * Clase estática para formatear texto en terminal usando códigos ANSI
 */
export class ANSI {
    // Configuración estática
    private static _supportsColor: boolean = process.stdout.isTTY;

    // Diccionario de estilos ANSI
    private static readonly styles: ANSIStyles = {
        // Reset global
        reset: '\x1b[0m',

        // Estilos básicos y sus Resets individuales
        bold: '\x1b[1m',
        resetBold: '\x1b[22m',
        dim: '\x1b[2m',
        resetDim: '\x1b[22m', // 22 quita tanto Bold como Dim
        italic: '\x1b[3m',
        resetItalic: '\x1b[23m',
        underline: '\x1b[4m',
        resetUnderline: '\x1b[24m',
        blink: '\x1b[5m',
        resetBlink: '\x1b[25m',
        blinkFast: '\x1b[6m',
        resetBlinkFast: '\x1b[25m',
        inverse: '\x1b[7m',
        resetInverse: '\x1b[27m',
        hidden: '\x1b[8m',
        resetHidden: '\x1b[28m',
        strikethrough: '\x1b[9m',
        resetStrikethrough: '\x1b[29m',

        // Colores de texto (Reset genérico: \x1b[39m)
        // El código 39 devuelve el texto al color por defecto de la terminal
        resetColor: '\x1b[39m',
        black: '\x1b[30m',
        red: '\x1b[31m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m',
        magenta: '\x1b[35m',
        cyan: '\x1b[36m',
        white: '\x1b[37m',
        gray: '\x1b[90m',
        error: '\x1b[31m',

        // Colores de texto brillantes
        redBright: '\x1b[91m',
        greenBright: '\x1b[92m',
        yellowBright: '\x1b[93m',
        blueBright: '\x1b[94m',
        magentaBright: '\x1b[95m',
        cyanBright: '\x1b[96m',
        whiteBright: '\x1b[97m',

        // Colores de fondo (Reset genérico: \x1b[49m)
        // El código 49 devuelve el fondo al color por defecto de la terminal
        resetBg: '\x1b[49m',
        bgBlack: '\x1b[40m',
        bgRed: '\x1b[41m',
        bgGreen: '\x1b[42m',
        bgYellow: '\x1b[43m',
        bgBlue: '\x1b[44m',
        bgMagenta: '\x1b[45m',
        bgCyan: '\x1b[46m',
        bgWhite: '\x1b[47m',
        bgGray: '\x1b[100m',

        // Colores de fondo brillantes
        bgRedBright: '\x1b[101m',
        bgGreenBright: '\x1b[102m',
        bgYellowBright: '\x1b[103m',
        bgBlueBright: '\x1b[104m',
        bgMagentaBright: '\x1b[105m',
        bgCyanBright: '\x1b[106m',
        bgWhiteBright: '\x1b[107m',
    };

    // Tipos de mensajes predefinidos
    private static readonly messageTypes = {
        success: ['bold', 'green'] as const,
        error: ['bold', 'red'] as const,
        warning: ['bold', 'yellow'] as const,
        info: ['bold', 'cyan'] as const,
        link: ['underline', 'bold', 'white'] as const, // Estilo predeterminado para enlaces
    } as const;

    /**
     * Obtiene el estado actual del soporte de color
     */
    static get supportsColor(): boolean {
        return this._supportsColor;
    }

    /**
     * Establece si se deben usar colores
     */
    static set supportsColor(enabled: boolean) {
        this._supportsColor = enabled;
    }

    /**
     * Formatea texto con códigos ANSI
     * @param text - Texto a formatear
     * @param styles - Estilos a aplicar
     * @returns Texto formateado
     */
    static format(text: string, ...styles: string[]): string {
        if (!this._supportsColor) return text;

        const styleCodes = styles.map((style) => this.styles[style] || '').join('');

        return `${styleCodes}${text}${this.styles.reset}`;
    }

    /**
     * Métodos rápidos para tipos comunes de mensajes
     */

    static success(text: string, ...styles: string[]): string {
        return this.format(text, ...this.messageTypes.success, ...styles);
    }

    static error(text: string, ...styles: string[]): string {
        return this.format(text, ...this.messageTypes.error, ...styles);
    }

    static warning(text: string, ...styles: string[]): string {
        return this.format(text, ...this.messageTypes.warning, ...styles);
    }

    static info(text: string, ...styles: string[]): string {
        return this.format(text, ...this.messageTypes.info, ...styles);
    }

    /**
     * Crea un texto con color RGB personalizado
     * @param text - Texto a colorear
     * @param r - Rojo (0-255)
     * @param g - Verde (0-255)
     * @param b - Azul (0-255)
     * @returns Texto con color RGB
     */
    static rgb(text: string, [r, g, b]: [number, number, number], ...styles: string[]): string {
        if (!this._supportsColor) return text;

        const styleCodes = styles.map((style) => this.styles[style] || '').join('');

        return `\x1b[38;2;${r};${g};${b}m${styleCodes}${text}${this.styles.reset}`;
    }

    /**
     * Crea un texto con fondo RGB personalizado
     * @param text - Texto a formatear
     * @param r - Rojo (0-255)
     * @param g - Verde (0-255)
     * @param b - Azul (0-255)
     * @returns Texto con fondo RGB
     */
    static bgRgb(text: string, [r, g, b]: [number, number, number], ...styles: string[]): string {
        if (!this._supportsColor) return text;

        const styleCodes = styles.map((style) => this.styles[style] || '').join('');

        return `\x1b[48;2;${r};${g};${b}m${styleCodes}${text}${this.styles.reset}`;
    }

    /**
     * Crea un enlace clickable para la terminal (OSC 8)
     * @param url - La URL del enlace
     * @param text - Texto visible (opcional, por defecto es la URL)
     * @param styles - Estilos adicionales para aplicar (opcional)
     * @returns Enlace formateado como código ANSI
     */
    static link(url: string, { text, styles }: { text?: string; styles?: string | string[] } = {}): string {
        if (!this._supportsColor) return text || url;

        styles = styles != null && !Array.isArray(styles) ? [styles] : styles ?? [];
        const linkText = text || url;
        const formattedText =
            styles.length > 0 ? this.format(linkText, ...styles) : this.format(linkText, ...this.messageTypes.link);

        // OSC 8 es el código para enlaces hipertexto
        // Formato: \x1b]8;;<url>\x1b\\<text>\x1b]8;;\x1b\\
        const OSC = '\x1b]8;;';
        const ST = '\x1b\\';

        return `${OSC}${url}${ST}${formattedText}${OSC}${ST}`;
    }

    /**
     * Método sobrecargado para crear enlaces con opciones
     * @param options - Opciones del enlace
     * @returns Enlace formateado
     */
    static superLink(options: {
        url: string;
        text?: string;
        styles?: string[];
        protocol?: 'http' | 'https' | 'ftp' | 'mailto' | 'file' | string;
    }): string {
        const { url, text, styles = [] } = options;

        // Asegurar que la URL tenga un protocolo válido si no lo tiene
        let finalUrl = url;
        if (options.protocol && !url.includes('://')) {
            finalUrl = `${options.protocol}://${url}`;
        } else if (!url.includes('://')) {
            // Por defecto asumimos http si no hay protocolo
            finalUrl = `https://${url}`;
        }

        return this.link(finalUrl, { text, styles });
    }

    /**
     * Método para crear enlaces de correo electrónico
     * @param email - Dirección de correo electrónico
     * @param text - Texto visible (opcional)
     * @param styles - Estilos adicionales (opcional)
     * @returns Enlace de email formateado
     */
    static email(email: string, text?: string, ...styles: string[]): string {
        const emailText = text || email;
        const emailUrl = email.startsWith('mailto:') ? email : `mailto:${email}`;

        return this.link(emailUrl, { text: emailText, styles });
    }

    /**
     * Método para crear enlaces con formato de botón
     * @param url - La URL del enlace
     * @param text - Texto del botón
     * @returns Enlace con formato de botón
     */
    static button(url: string, text: string = 'Abrir enlace'): string {
        return this.link(url, { text: ` ${text} `, styles: ['bold', 'white', 'bgBlue', 'underline'] });
    }

    /**
     * Métodos de utilidad
     */

    static getCode(styleName: string): string {
        return this.styles[styleName] || '';
    }

    static listStyles(): string[] {
        return Object.keys(this.styles);
    }

    static addStyle(name: string, code: string): void {
        (this.styles as ANSIStyles)[name] = code;
    }

    /**
     * Crea una barra de progreso simple
     * @param current - Valor actual
     * @param total - Valor total
     * @param width - Ancho de la barra
     * @returns Barra de progreso formateada
     */
    static progressBar(current: number, total: number, width: number = 40): string {
        if (!this._supportsColor) return `[${current}/${total}]`;

        const percentage = Math.min(current / total, 1);
        const filledWidth = Math.round(width * percentage);
        const emptyWidth = width - filledWidth;

        const filled = '█'.repeat(filledWidth);
        const empty = '░'.repeat(emptyWidth);

        const color = percentage < 0.3 ? 'red' : percentage < 0.6 ? 'yellow' : 'green';

        const bar = this.format(filled, color) + this.format(empty, 'dim');
        const percentText = Math.round(percentage * 100);

        return `${bar} ${percentText}% (${current}/${total})`;
    }

    /**
     * Crea una tabla simple con bordes
     * @param headers - Encabezados de la tabla
     * @param rows - Filas de datos
     * @returns Tabla formateada
     */
    static table(headers: string[], rows: string[][]): string {
        if (!this._supportsColor) return [headers.join(' | '), ...rows.map((row) => row.join(' | '))].join('\n');

        // Calcular anchos de columna
        const colWidths = headers.map((header, i) => {
            const rowValues = rows.map((row) => row[i] || '');
            return Math.max(header.length, ...rowValues.map((v) => v.length));
        });

        // Crear línea separadora
        const separatorLine = '─'.repeat(colWidths.reduce((a, b) => a + b + 3, 1));

        // Formatear encabezados
        const headerLine =
            '│ ' +
            headers.map((header, i) => this.format(header.padEnd(colWidths[i]), 'bold', 'cyan')).join(' │ ') +
            ' │';

        // Formatear filas
        const rowLines = rows.map(
            (row) => '│ ' + row.map((cell, i) => (cell || '').padEnd(colWidths[i])).join(' │ ') + ' │',
        );

        return [`┌${separatorLine}┐`, headerLine, `├${separatorLine}┤`, ...rowLines, `└${separatorLine}┘`].join('\n');
    }

    /**
     * Verifica si el terminal soporta enlaces clickables
     * @returns true si el terminal soporta OSC 8 (enlaces hipertexto)
     */
    static supportsHyperlinks(): boolean {
        // La mayoría de terminales modernos soportan OSC 8
        // Podríamos hacer una detección más precisa basada en TERM o variables de entorno
        return (
            this._supportsColor &&
            (process.env.TERM_PROGRAM === 'vscode' ||
                process.env.TERM_PROGRAM === 'iTerm.app' ||
                process.env.TERM === 'xterm-256color' ||
                process.env.TERM === 'screen-256color' ||
                process.env.TERM === 'tmux-256color' ||
                !!process.env.WT_SESSION || // Windows Terminal
                !!process.env.HYPERLINK_SUPPORT) // Variable personalizada
        );
    }
}
