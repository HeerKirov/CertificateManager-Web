(function () {
    const Vue = window['Vue']
    const $ = window['$']
    const client = window['client']
    const webURL = window['webURL']
    const serverURL = window['serverURL']
    const NO_COVER_URL = `${window['staticURL']}/images/no_cover.jpg`

    let delegateList = []

    let vm = new Vue({
        el: '#top-bar',
        data: {
            profile: {
                is_authenticated: null,
                is_staff: null,
                username: '',
                userType: '',
                cardId: '',
                name: ''
            }
        },
        computed: { },
        methods: {
            logout() {
                client.setToken(null)
                window.location.href = `${webURL}/login/`
            },
            //辅助函数
            joinCountRange(list: number[]): string {
                let ret = '', first = true
                for(let i of list) {
                    if(first) first = false
                    else ret += '、'
                    ret += i
                }
                return ret
            },
            //委托
            delegateOnProfile(delegate: (profile) => void) {
                if(this.profile.is_authenticated != null) {
                    delegate(this.profile)
                }else{
                    delegateList.splice(delegateList.length, 0, delegate)
                }
            }
        },
        created() {
            client.auth.info.get((ok, s, d) => {
                if(ok) {
                    this.profile.is_authenticated = true
                    this.profile.is_staff = d['is_staff']
                    this.profile.username = d['username']
                    this.profile.name = d['name']
                    let split = this.profile.username.split(':')
                    this.profile.userType = split[0]
                    this.profile.cardId = split[1]
                    if(delegateList.length > 0) {
                        for(let delegate of delegateList) delegate(this.profile)
                        delegateList = []
                    }
                }else{
                    window.location.href = `${webURL}/login`
                }
            })
        }
    })

    window['vms']['top-bar'] = vm
})()