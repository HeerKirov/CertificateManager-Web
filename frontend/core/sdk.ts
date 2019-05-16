const TOKEN_NAME: string = 'certificate-manager-token'

class Client {
    private readonly serverURL: string
    private readonly tokenName: string
    private instance
    private token: string

    constructor(params: {serverURL: string, tokenPrefix?: string}) {
        this.serverURL = params.serverURL + '/api'
        this.tokenName = (params.tokenPrefix || '') + TOKEN_NAME
        this.instance = window['axios'].create()
        if(window.localStorage[this.tokenName]) {
            this.token = window.localStorage[this.tokenName]
        }
        this.generate()
    }

    private getURL(url: string): string {
        return `${this.serverURL}${url}/`
    }
    private getDetailURL(url: string, id: any): string {
        return `${this.serverURL}${url}/${encodeURIComponent(id)}/`
    }
    private getHeaders(contentType?: string): {} {
        let ret: any = {}
        if(this.token) ret['Authorization'] = `Token ${this.token}`
        if(contentType) ret['Content-Type'] = contentType
        return this.token || contentType ? ret : null
    }

    private static callbackSuccess(callback: (success: boolean, status: number, data: any) => void, response: any): void {
        callback(true, response.status, response.data)
    }
    private callbackFailed(callback: (success: boolean, status: number, data: any) => void, error: any): void {
        if(error.response) {
            if(error.response.status === 401 && error.response.data && error.response.data.detail === 'Invalid token.') {
                this.setToken(null)
            }
            callback(false, error.response.status, error.response.data)
        }else{
            callback(false, null, null)
        }
    }
    private generateMethod(method: string, url: string) {
        return {
            list: (url: string) => (params, callback) =>
                this.instance.get(this.getURL(url), {params, headers: this.getHeaders()})
                    .then((response) => Client.callbackSuccess(callback, response))
                    .catch((error) => this.callbackFailed(callback, error)),
            create: (url: string) => (content, callback) =>
                this.instance.post(this.getURL(url), content, {headers: this.getHeaders()})
                    .then((response) => Client.callbackSuccess(callback, response))
                    .catch((error) => this.callbackFailed(callback, error)),
            retrieve: (url: string) => (id, callback) =>
                this.instance.get(this.getDetailURL(url, id), {headers: this.getHeaders()})
                    .then((response) => Client.callbackSuccess(callback, response))
                    .catch((error) => this.callbackFailed(callback, error)),
            update: (url: string) => (id, content, callback) =>
                this.instance.put(this.getDetailURL(url, id), content, {headers: this.getHeaders()})
                    .then((response) => Client.callbackSuccess(callback, response))
                    .catch((error) => this.callbackFailed(callback, error)),
            partialUpdate: (url: string) => (id, content, callback) =>
                this.instance.patch(this.getDetailURL(url, id), content, {headers: this.getHeaders()})
                    .then((response) => Client.callbackSuccess(callback, response))
                    .catch((error) => this.callbackFailed(callback, error)),
            delete: (url: string) => (id, callback) =>
                this.instance.delete(this.getDetailURL(url, id), {headers: this.getHeaders()})
                    .then((response) => Client.callbackSuccess(callback, response))
                    .catch((error) => this.callbackFailed(callback, error)),
            get: (url: string) => (params, callback) =>
                this.instance.get(this.getURL(url), {params: callback ? params : null, headers: this.getHeaders()})
                    .then((response) => Client.callbackSuccess(callback || params, response))
                    .catch((error) => this.callbackFailed(callback || params, error)),
            download: (url: string) => (params, callback) =>
                this.instance.get(this.getURL(url), {params: callback ? params : null, headers: this.getHeaders(), responseType: 'arraybuffer'})
                    .then((response) => Client.callbackSuccess(callback || params, response))
                    .catch((error) => this.callbackFailed(callback || params, error)),
            post: (url: string) => (content, params, callback) =>
                this.instance.post(this.getURL(url), content, {params: callback ? params : null, headers: this.getHeaders()})
                    .then((response) => Client.callbackSuccess(callback || params, response))
                    .catch((error) => this.callbackFailed(callback || params, error)),
            put: (url: string) => (content, callback) =>
                this.instance.put(this.getURL(url), content, {headers: this.getHeaders()})
                    .then((response) => Client.callbackSuccess(callback, response))
                    .catch((error) => this.callbackFailed(callback, error)),
            patch: (url) => (content, callback) =>
                this.instance.patch(this.getURL(url), content, {headers: this.getHeaders()})
                    .then((response) => Client.callbackSuccess(callback, response))
                    .catch((error) => this.callbackFailed(callback, error))
        }[method](url)
    }
    private endpoint(url: string, includes?: string[], extra_action?: {}): Object {
        includes = includes || ['list', 'create', 'retrieve', 'update', 'partialUpdate', 'delete']
        let ret = {}
        if(extra_action) {
            for(let key in extra_action) {
                ret[key] = extra_action[key]
            }
        }
        for(let i of includes) {
            ret[i] = this.generateMethod(i, url)
        }
        return ret
    }
    private generateCoverData(url: string) {
        return (id, file, callback) => {
            let form = new FormData()
            form.append('cover', file)
            form.append('id', id)
            this.instance.post(this.getURL(url), form, {headers: this.getHeaders("multipart/form-data")})
                .then((response) => Client.callbackSuccess(callback, response))
                .catch((error) => this.callbackFailed(callback, error))
        }
    }
    private generate() {
        this['auth'] = {
            login: this.endpoint('/auth/login', ['post']),
            logout: this.endpoint('/auth/logout', ['post']),
            token: this.endpoint('/auth/token', ['post']),
            info: this.endpoint('/auth/info', ['get', 'put', 'patch']),
        }
        this['admin'] = {
            users: this.endpoint('/admin/users', ['list', 'create', 'retrieve', 'update', 'partialUpdate']),
            colleges: this.endpoint('/admin/colleges'),
            subjects: this.endpoint('/admin/subjects'),
            classes: this.endpoint('/admin/classes'),
            students: this.endpoint('/admin/students'),
            teachers: this.endpoint('/admin/teachers'),
            ratingInfo: this.endpoint('/admin/rating-info'),
            competitions: this.endpoint('/admin/competitions'),
            records: this.endpoint('/admin/records', ['list', 'retrieve', 'update'], {
                download: this.endpoint('/admin/records/download', ['download'])
            }),
            collegeBatch: this.endpoint('/admin/college-batch', ['post']),
            subjectBatch: this.endpoint('/admin/subject-batch', ['post']),
            classBatch: this.endpoint('/admin/class-batch', ['post']),
            studentBatch: this.endpoint('/admin/student-batch', ['post']),
            teacherBatch: this.endpoint('/admin/teacher-batch', ['post']),
            ratingInfoBatch: this.endpoint('/admin/rating-info-batch', ['post']),
        }
    }

    setToken(token: string): void {
        this.token = token
        if(token) {
            window.localStorage[this.tokenName] = token
        }else if(window.localStorage[this.tokenName]) {
            window.localStorage.removeItem(this.tokenName)
        }
    }
}