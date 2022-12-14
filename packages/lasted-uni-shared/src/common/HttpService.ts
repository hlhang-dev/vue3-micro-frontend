import ApiUnifiedVO from '../beans/http/vo/ApiUnifiedVO'
import HttpStatusCode from '../definition/http/HttpStatusEnum'
import { Lang } from '../definition/Lang'
import { ShowNoticeManagement } from '../management/ShowNoticeManagement'
import { LoginManagement } from '../management/LoginManagement'
import { UniAppManagement } from '../management/UniAppManagement'
import { PageManagement } from '../management/PageManagement'
import MyResponseCodeEnum from '../definition/http/MyResponseCodeEnum'

export class HttpService {
  private static SERVER_API_TIMEOUT: number = 0

  private static ANTI_SHAKE_COUNTER = 0

  private static LOGIN_PAGE = ''

  private static IS_SHOW_LOADING = false

  private static HEADER = {}

  public static init(loginPage: string, timeout: number, header: object = {},isShowLoading: boolean) {
    this.SERVER_API_TIMEOUT = timeout
    this.LOGIN_PAGE = loginPage
    this.IS_SHOW_LOADING = isShowLoading
    this.HEADER  = header
  }

  public static doRequest(
      url: string,
      method: string,
      data: object = {},
      headers?: object,
      showLoading = true,
  ): Promise<ApiUnifiedVO> {
    return new Promise<ApiUnifiedVO>((resolve, reject) => {
      UniAppManagement.wxRequest(url, method, data, HttpService.SERVER_API_TIMEOUT, (responseCodeEnum: MyResponseCodeEnum, result?: ApiUnifiedVO) => {
        switch (responseCodeEnum) {
          case MyResponseCodeEnum.SUCCESS:
            if (result) {
              HttpService.onHttpCodeChange(result.statusCode)
              resolve(result)
            }
            break
          case MyResponseCodeEnum.FAILED:
            ShowNoticeManagement.showNormalNotice(Lang.PLEASE_CONTACT_THE_ADMINISTRATOR)
            reject()
            break
        }
      }, headers, this.IS_SHOW_LOADING ? showLoading: false,this.HEADER)
    })
  }

  private static onHttpCodeChange(statusCode: HttpStatusCode) {
    switch (statusCode) {
      case HttpStatusCode.NO_PERMISSION:
        HttpService.onNoPermission()
        break
      case HttpStatusCode.FAILED:
        ShowNoticeManagement.showNormalNotice(Lang.PLEASE_CONTACT_THE_ADMINISTRATOR)
        break
      default:
        break
    }
  }

  private static onNoPermission() {
    HttpService.ANTI_SHAKE_COUNTER += 1
    if (HttpService.isCanShowExpiredLoginModel()) {
      const title: string = LoginManagement.getInstance().isAccountLogin() ? Lang.LOGIN_BE_OVERDUE_NOTICE: Lang.LOGIN_NOTICE
      const content: string = LoginManagement.getInstance().isAccountLogin() ? Lang.LOGIN_BE_OVERDUE: Lang.NOT_LOGGED_IN
      UniAppManagement.doShowModal(title, content, false, HttpService.onLoginBeOverdueCallback)
    }
  }

  private static isCanShowExpiredLoginModel() {
    return HttpService.ANTI_SHAKE_COUNTER === 1
  }

  private static onLoginBeOverdueCallback() {
    PageManagement.navigateToPage(this.LOGIN_PAGE, undefined, HttpService.onMoveToLoginPageSuccess)
  }

  private static onMoveToLoginPageSuccess() {
    HttpService.resetExpiredCounter()
  }

  private static resetExpiredCounter() {
    HttpService.ANTI_SHAKE_COUNTER = 0
  }
}
