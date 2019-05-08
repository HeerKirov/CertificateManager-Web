class Excel {
    static uploadXlsx(fileUploadSelector: string, callback: (XLSX) => void): void {
        const $ = window['$']
        const XLSX = window['XLSX']
        let fileUpload = $(fileUploadSelector).get(0)
        if(fileUpload) {
            let file = fileUpload.files[0]
            if(file != undefined) {
                let reader = new FileReader();
                reader.onload = (e) => {
                    let data = e.target['result']
                    let work = XLSX.read(data, {type: 'binary'})
                    callback(work)
                }
                reader.readAsBinaryString(file)
            }
        }
    }
    static getColumnValue(col: string) {
        let result = 0, w = 1
        for(let i = col.length - 1; i >= 0; --i) {
            result += (col[i].charCodeAt(i) - 65) * w
            w *= 26
        }
        return result
    }
    static getColumnName(col: number): string {
        if(col === 0) return 'A'
        let result = ''
        while(col) {
            let n = col % 26
            col = Math.floor(col / 26)
            result = String.fromCharCode(n + 65) + result
        }
        return result
    }
    static getSheetRange(ref: string): {row1: number, row2: number, column1: number, column2: number} {
        let result = ref.match(/([A-Z]+)([0-9]+):([A-Z]+)([0-9]+)/)
        let column1 = Excel.getColumnValue(result[1]), column2 = Excel.getColumnValue(result[3])
        let row1 = parseInt(result[2]), row2 = parseInt(result[4])
        return {row1, row2, column1, column2}
    }
    static translateXlsxToJson(xlsx, mapping): Object | undefined {
        if(xlsx.SheetNames.length > 0) {
            let sheet = xlsx.Sheets[xlsx.SheetNames[0]]
            let mappingCol = {}
            let {row1, row2, column1, column2} = Excel.getSheetRange(sheet['!ref'])
            for(let i = column1; i <= column2; ++i) {
                let col = Excel.getColumnName(i)
                let value = sheet[`${col}${row1}`]
                if(value && value.v && value.v in mapping) {
                    mappingCol[i] = mapping[value.v]
                }
            }
            let result = []
            for(let row = row1 + 1; row <= row2; ++row) {
                let obj = {}
                let useful = false
                for(let column = column1; column <= column2; ++column) {
                    let col = Excel.getColumnName(column)
                    let value = sheet[`${col}${row}`]
                    obj[mappingCol[column]] = value.v
                    if(value.v) useful = true
                }
                if(useful) result[result.length] = obj
            }
            return result
        }else{
            alert('xlsx文件至少应该有一个工作表。')
            return undefined
        }
    }
}
window['Excel'] = Excel