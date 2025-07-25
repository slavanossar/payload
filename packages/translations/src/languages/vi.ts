import type { DefaultTranslationsObject, Language } from '../types.js'

export const viTranslations: DefaultTranslationsObject = {
  authentication: {
    account: 'Tài khoản',
    accountOfCurrentUser: 'Tài khoản của người dùng hiện tại',
    accountVerified: 'Tài khoản đã được xác minh thành công.',
    alreadyActivated: 'Đã được kích hoạt',
    alreadyLoggedIn: 'Đã đăng nhập',
    apiKey: 'API Key',
    authenticated: 'Đã xác thực',
    backToLogin: 'Quay lại đăng nhập.',
    beginCreateFirstUser: 'Để bắt đầu, hãy tạo người dùng đầu tiên.',
    changePassword: 'Đổi mật khẩu',
    checkYourEmailForPasswordReset:
      'Nếu địa chỉ email được liên kết với một tài khoản, bạn sẽ nhận được hướng dẫn để đặt lại mật khẩu trong thời gian ngắn. Vui lòng kiểm tra thư mục spam hoặc thư rác nếu bạn không thấy email trong hộp thư đến của mình.',
    confirmGeneration: 'Xác nhận, tạo API Key',
    confirmPassword: 'Xác nhận mật khẩu',
    createFirstUser: 'Tạo người dùng đầu tiên',
    emailNotValid: 'Email không chính xác',
    emailOrUsername: 'Email hoặc Tên tài khoản',
    emailSent: 'Email đã được gửi',
    emailVerified: 'Email đã được xác minh thành công.',
    enableAPIKey: 'Kích hoạt API Key',
    failedToUnlock: 'Mở khóa thất bại',
    forceUnlock: 'Mở khóa tài khoản',
    forgotPassword: 'Quên mật khẩu',
    forgotPasswordEmailInstructions: 'Nhập email của bạn để nhận hướng dẫn tạo lại mật khẩu.',
    forgotPasswordQuestion: 'Quên mật khẩu?',
    forgotPasswordUsernameInstructions:
      'Vui lòng nhập tên người dùng của bạn bên dưới. Hướng dẫn về cách đặt lại mật khẩu của bạn sẽ được gửi đến địa chỉ email liên kết với tên người dùng của bạn.',
    generate: 'Tạo',
    generateNewAPIKey: 'Tạo API Key mới',
    generatingNewAPIKeyWillInvalidate:
      'Việc tạo API Key mới sẽ <1>vô hiệu hóa</1> API Key cũ. Bạn có muốn tiếp tục không?',
    lockUntil: 'Khóa lại cho tới thời điểm sau',
    logBackIn: 'Đăng nhập lại',
    loggedIn:
      'Để đăng nhập dưới tên người dùng khác, bạn phải <0>đăng xuất</0> người dùng hiện tại.',
    loggedInChangePassword: 'Để đổi mật khẩu, hãy truy cập cài đặt <0>tài khoản</0>.',
    loggedOutInactivity: 'Bạn đã tự động đăng xuất sau một khoản thời gian dài không thao tác.',
    loggedOutSuccessfully: 'Đăng xuất thành công.',
    loggingOut: 'Đang đăng xuất...',
    login: 'Đăng nhập',
    loginAttempts: 'Lần đăng nhập',
    loginUser: 'Đăng nhập người dùng',
    loginWithAnotherUser:
      'Để đăng nhập dưới tên người dùng khác, bạn phải <0>đăng xuất</0> người dùng hiện tại.',
    logOut: 'Đăng xuất',
    logout: 'Đăng xuất',
    logoutSuccessful: 'Đăng xuất thành công.',
    logoutUser: 'Đăng xuất người dùng',
    newAccountCreated:
      'Một tài khoản mới đã được tạo cho bạn. Tài khoản này được dùng để truy cập <a href="{{serverURL}}">{{serverURL}}</a> Hãy nhấp chuột hoặc sao chép đường dẫn sau vào trình duyệt của bạn để xác thực email: <a href="{{verificationURL}}">{{verificationURL}}</a><br> Sau khi email được xác thực, bạn sẽ có thể đăng nhập.',
    newAPIKeyGenerated: 'API Key mới đã được tạo',
    newPassword: 'Mật khẩu mới',
    passed: 'Xác thực thành công',
    passwordResetSuccessfully: 'Đặt lại mật khẩu thành công.',
    resetPassword: 'Tạo lại mật khẩu',
    resetPasswordExpiration: 'Hạn tạo lại mật khẩu ',
    resetPasswordToken: 'Tạo lại token cho mật khẩu',
    resetYourPassword: 'Tạo lại mật khẩu',
    stayLoggedIn: 'Duy trì đăng nhập',
    successfullyRegisteredFirstUser: 'Đã đăng ký thành công người dùng đầu tiên.',
    successfullyUnlocked: 'Mở khóa thành công',
    tokenRefreshSuccessful: 'Làm mới token thành công.',
    unableToVerify: 'Không thể xác thực',
    username: 'Tên đăng nhập',
    usernameNotValid: 'Tên người dùng được cung cấp không hợp lệ',
    verified: 'Đã xác thực',
    verifiedSuccessfully: 'Đã xác thực thành công',
    verify: 'Tiến hành xác thực',
    verifyUser: 'Tiến hành xác thực người dùng',
    verifyYourEmail: 'Tiến hành xác thực email',
    youAreInactive:
      'Bạn đã không thao tác trong một khoảng thời gian, và sẽ bị tự động đăng xuất vì lý do bảo mật. Bạn có muốn tiếp tục phiên đăng nhập.',
    youAreReceivingResetPassword:
      'Bạn nhận được tin nhắn này vì bạn (hoặc một người nào khác) đã gửi yêu cầu thay đổi mật khẩu tài khoản của bạn. Xin hãy nhấp chuột vào đường dẫn sau, hoặc sao chép vào trình duyệt của bạn để hoàn tất quá trình:',
    youDidNotRequestPassword:
      'Nếu bạn không phải là người yêu cầu thay đổi mật khẩu, xin hãy bỏ qua tin nhắn này và mật khẩu của bạn sẽ được giữ nguyên.',
  },
  error: {
    accountAlreadyActivated: 'Lỗi - Tài khoản này đã được kích hoạt.',
    autosaving: 'Lỗi - Đã xảy ra vấn đề khi tự động sao lưu bản tài liệu này.',
    correctInvalidFields: 'Lỗi - Xin hãy sửa lại những fields không hợp lệ.',
    deletingFile: 'Lỗi - Đã xảy ra vấn đề khi xóa tệp này.',
    deletingTitle:
      'Lỗi - Đã xảy ra vấn đề khi xóa {{title}}. Hãy kiểm tra kết nối mạng và thử lại.',
    documentNotFound:
      'Tài liệu có ID {{id}} không thể tìm thấy. Nó có thể đã bị xóa hoặc chưa từng tồn tại, hoặc bạn có thể không có quyền truy cập vào nó.',
    emailOrPasswordIncorrect: 'Lỗi - Email hoặc mật khẩu không chính xác.',
    followingFieldsInvalid_one: 'Lỗi - Field sau không hợp lệ:',
    followingFieldsInvalid_other: 'Lỗi - Những fields sau không hợp lệ:',
    incorrectCollection: 'Lỗi - Collection không hợp lệ.',
    insufficientClipboardPermissions:
      'Truy cập vào bộ nhớ tạm bị từ chối. Vui lòng kiểm tra quyền truy cập bộ nhớ tạm của bạn.',
    invalidClipboardData: 'Dữ liệu bộ nhớ tạm không hợp lệ.',
    invalidFileType: 'Lỗi - Định dạng tệp không hợp lệ.',
    invalidFileTypeValue: 'Lỗi - Định dạng tệp không hợp lệ: {{value}}.',
    invalidRequestArgs: 'Các đối số không hợp lệ đã được truyền trong yêu cầu: {{args}}',
    loadingDocument: 'Lỗi - Đã xảy ra vấn để khi tải bản tài liệu với ID {{id}}.',
    localesNotSaved_one: 'Không thể lưu trữ cài đặt vùng sau đây:',
    localesNotSaved_other: 'Không thể lưu trữ các cài đặt vùng sau đây:',
    logoutFailed: 'Đăng xuất thất bại.',
    missingEmail: 'Lỗi - Thiếu email.',
    missingIDOfDocument: 'Lỗi - Thiếu ID của bản tài liệu cần cập nhật.',
    missingIDOfVersion: 'Lỗi - Thiếu ID của phiên bản.',
    missingRequiredData: 'Lỗi - Thiếu dữ liệu cần thiết.',
    noFilesUploaded: 'Lỗi - File chưa được tải lên.',
    noMatchedField: 'Lỗi - Không tìm thấy field trùng với "{{label}}".',
    notAllowedToAccessPage: 'Lỗi - Bạn không có quyền truy cập trang này.',
    notAllowedToPerformAction: 'Lỗi - Bạn không có quyền thực hiện lệnh này.',
    notFound: 'Lỗi - Không thể tìm thấy.',
    noUser: 'Lỗi - Request thiếu thông tin người dùng.',
    previewing: 'Lỗi - Đã xảy ra vấn đề khi xem trước bản tài liệu này.',
    problemUploadingFile: 'Lỗi - Đã xảy ra vấn để khi tải lên file sau.',
    tokenInvalidOrExpired: 'Lỗi - Token không hợp lệ hoặc đã hết hạn.',
    tokenNotProvided: 'Không cung cấp mã thông báo.',
    unableToCopy: 'Không thể sao chép.',
    unableToDeleteCount: 'Không thể xóa {{count}} trong số {{total}} {{label}}.',
    unableToReindexCollection:
      'Lỗi khi tái lập chỉ mục bộ sưu tập {{collection}}. Quá trình bị hủy.',
    unableToUpdateCount: 'Không thể cập nhật {{count}} trên {{total}} {{label}}.',
    unauthorized: 'Lỗi - Bạn cần phải đăng nhập trước khi gửi request sau.',
    unauthorizedAdmin: 'Lỗi - Người dùng không có quyền truy cập vào bảng điều khiển.',
    unknown: 'Lỗi - Không xác định (unknown error).',
    unPublishingDocument: 'Lỗi - Đã xảy ra vấn để khi ẩn bản tài liệu.',
    unspecific: 'Lỗi - Đã xảy ra (unspecific error).',
    unverifiedEmail: 'Vui lòng xác minh email trước khi đăng nhập.',
    userEmailAlreadyRegistered: 'Người dùng với email đã cho đã được đăng ký.',
    userLocked: 'Lỗi- Tài khoản đã bị khóa do đăng nhập thất bại nhiều lần.',
    usernameAlreadyRegistered: 'Một người dùng với tên đăng nhập đã cho đã được đăng ký.',
    usernameOrPasswordIncorrect: 'Tên người dùng hoặc mật khẩu được cung cấp không chính xác.',
    valueMustBeUnique: 'Lỗi - Giá trị không được trùng lặp.',
    verificationTokenInvalid: 'Lỗi - Token dùng để xác thực không hợp lệ.',
  },
  fields: {
    addLabel: 'Thêm: {{label}}',
    addLink: 'Thêm liên kết',
    addNew: 'Thêm mới',
    addNewLabel: 'Thêm mới: {{label}}',
    addRelationship: 'Thêm mối quan hệ (relationship)',
    addUpload: 'Thêm tải lên (upload)',
    block: 'block',
    blocks: 'blocks',
    blockType: 'Block Type',
    chooseBetweenCustomTextOrDocument:
      'Chọn giữa nhập URL văn bản tùy chỉnh hoặc liên kết đến tài liệu khác.',
    chooseDocumentToLink: 'Chọn một tài liệu để liên kết đến',
    chooseFromExisting: 'Chọn từ thư viện',
    chooseLabel: 'Chọn: {{label}}',
    collapseAll: 'Ẩn toàn bộ',
    customURL: 'URL tùy chỉnh',
    editLabelData: 'Chỉnh sửa nội dung của: {{label}}',
    editLink: 'Chỉnh sửa liên kết',
    editRelationship: 'Chỉnh sửa mối quan hệ',
    enterURL: 'Nhập một URL',
    internalLink: 'Liên kết nội bộ',
    itemsAndMore: '{{items}} và {{count}} món nữa',
    labelRelationship: 'Mối quan hệ của {{label}} (Relationship)',
    latitude: 'Vĩ độ',
    linkedTo: 'Được nối với <0>{{label}}</0>',
    linkType: 'Loại liên kết',
    longitude: 'Kinh độ',
    newLabel: 'Tạo {{label}} mới',
    openInNewTab: 'Mở trong trang mới',
    passwordsDoNotMatch: 'Mật khẩu không trùng.',
    relatedDocument: 'bản tài liệu liên quan',
    relationTo: 'Có quan hệ với',
    removeRelationship: 'Xóa Mối quan hệ',
    removeUpload: 'Xóa bản tải lên',
    saveChanges: 'Luu thay đổi',
    searchForBlock: 'Tìm block',
    selectExistingLabel: 'Chọn một {{label}} có sẵn',
    selectFieldsToEdit: 'Chọn các trường để chỉnh sửa',
    showAll: 'Hiển thị toàn bộ',
    swapRelationship: 'Đổi quan hệ',
    swapUpload: 'Đổi bản tải lên',
    textToDisplay: 'Văn bản để hiển thị',
    toggleBlock: 'Bật/tắt block',
    uploadNewLabel: 'Tải lên bản mới: {{label}}',
  },
  folder: {
    browseByFolder: 'Duyệt theo Thư mục',
    byFolder: 'Theo Thư mục',
    deleteFolder: 'Xóa Thư mục',
    folderName: 'Tên thư mục',
    folders: 'Thư mục',
    folderTypeDescription: 'Chọn loại tài liệu bộ sưu tập nào nên được cho phép trong thư mục này.',
    itemHasBeenMoved: '{{title}} đã được chuyển đến {{folderName}}',
    itemHasBeenMovedToRoot: '{{title}} đã được chuyển đến thư mục gốc',
    itemsMovedToFolder: '{{title}} đã được di chuyển vào {{folderName}}',
    itemsMovedToRoot: '{{title}} đã được di chuyển vào thư mục gốc',
    moveFolder: 'Di chuyển thư mục',
    moveItemsToFolderConfirmation:
      'Bạn sắp chuyển <1>{{count}} {{label}}</1> tới <2>{{toFolder}}</2>. Bạn có chắc chắn không?',
    moveItemsToRootConfirmation:
      'Bạn đang chuẩn bị di chuyển <1>{{count}} {{label}}</1> đến thư mục gốc. Bạn có chắc không?',
    moveItemToFolderConfirmation:
      'Bạn sắp chuyển <1>{{title}}</1> đến <2>{{toFolder}}</2>. Bạn có chắc không?',
    moveItemToRootConfirmation:
      'Bạn đang chuẩn bị di chuyển <1>{{title}}</1> đến thư mục gốc. Bạn có chắc chắn không?',
    movingFromFolder: 'Di chuyển {{title}} từ {{fromFolder}}',
    newFolder: 'Thư mục mới',
    noFolder: 'Không có Thư mục',
    renameFolder: 'Đổi tên thư mục',
    searchByNameInFolder: 'Tìm kiếm theo Tên trong {{folderName}}',
    selectFolderForItem: 'Chọn thư mục cho {{title}}',
  },
  general: {
    name: 'Tên',
    aboutToDelete: 'Chuẩn bị xóa {{label}} <1>{{title}}</1>. Bạn có muốn tiếp tục không?',
    aboutToDeleteCount_many: 'Bạn sắp xóa {{count}} {{label}}',
    aboutToDeleteCount_one: 'Bạn sắp xóa {{count}} {{label}}',
    aboutToDeleteCount_other: 'Bạn sắp xóa {{count}} {{label}}',
    addBelow: 'Thêm bên dưới',
    addFilter: 'Thêm bộ lọc',
    adminTheme: 'Giao diện bảng điều khiển',
    all: 'Tất cả',
    allCollections: 'Tất cả Bộ sưu tập',
    allLocales: 'Tất cả địa phương',
    and: 'Và',
    anotherUser: 'Người dùng khác',
    anotherUserTakenOver: 'Người dùng khác đã tiếp quản việc chỉnh sửa tài liệu này.',
    applyChanges: 'Áp dụng Thay đổi',
    ascending: 'Sắp xếp theo thứ tự tăng dần',
    automatic: 'Tự động',
    backToDashboard: 'Quay lại bảng điều khiển',
    cancel: 'Hủy',
    changesNotSaved: 'Thay đổi chưa được lưu lại. Bạn sẽ mất bản chỉnh sửa nếu thoát bây giờ.',
    clear: 'Rõ ràng',
    clearAll: 'Xóa tất cả',
    close: 'Gần',
    collapse: 'Thu gọn',
    collections: 'Collections',
    columns: 'Hiển thị cột',
    columnToSort: 'Sắp xếp cột',
    confirm: 'Xác nhận',
    confirmCopy: 'Xác nhận bản sao',
    confirmDeletion: 'Xác nhận xóa',
    confirmDuplication: 'Xác nhận tạo bản sao',
    confirmMove: 'Xác nhận di chuyển',
    confirmReindex: 'Tái lập chỉ mục tất cả {{collections}}?',
    confirmReindexAll: 'Tái lập chỉ mục tất cả các bộ sưu tập?',
    confirmReindexDescription:
      'Điều này sẽ xóa các chỉ mục hiện tại và tái lập chỉ mục các tài liệu trong các bộ sưu tập {{collections}}.',
    confirmReindexDescriptionAll:
      'Điều này sẽ xóa các chỉ mục hiện tại và tái lập chỉ mục các tài liệu trong tất cả các bộ sưu tập.',
    copied: 'Đâ sao chép',
    copy: 'Sao chép',
    copyField: 'Sao chép trường',
    copying: 'Sao chép',
    copyRow: 'Sao chép dòng',
    copyWarning:
      'Bạn đang chuẩn bị ghi đè {{to}} bằng {{from}} cho {{label}} {{title}}. Bạn có chắc chắn không?',
    create: 'Tạo',
    created: 'Đã tạo',
    createdAt: 'Ngày tạo',
    createNew: 'Tạo mới',
    createNewLabel: 'Tạo mới {{label}}',
    creating: 'Đang tạo',
    creatingNewLabel: 'Đang tạo mới {{label}}',
    currentlyEditing:
      'hiện đang chỉnh sửa tài liệu này. Nếu bạn tiếp quản, họ sẽ bị chặn tiếp tục chỉnh sửa và cũng có thể mất các thay đổi chưa lưu.',
    custom: 'Tùy chỉnh',
    dark: 'Nền tối',
    dashboard: 'Bảng điều khiển',
    delete: 'Xóa',
    deletedCountSuccessfully: 'Đã xóa thành công {{count}} {{label}}.',
    deletedSuccessfully: 'Đã xoá thành công.',
    deleting: 'Đang xóa...',
    depth: 'Độ sâu',
    descending: 'Xếp theo thứ tự giảm dần',
    deselectAllRows: 'Bỏ chọn tất cả các hàng',
    document: 'Tài liệu',
    documentLocked: 'Tài liệu bị khóa',
    documents: 'Tài liệu',
    duplicate: 'Tạo bản sao',
    duplicateWithoutSaving: 'Không lưu dữ liệu và tạo bản sao',
    edit: 'Chỉnh sửa',
    editAll: 'Chỉnh sửa tất cả',
    editedSince: 'Được chỉnh sửa từ',
    editing: 'Đang chỉnh sửa',
    editingLabel_many: 'Đang chỉnh sửa {{count}} {{label}}',
    editingLabel_one: 'Đang chỉnh sửa {{count}} {{label}}',
    editingLabel_other: 'Đang chỉnh sửa {{count}} {{label}}',
    editingTakenOver: 'Chỉnh sửa đã được tiếp quản',
    editLabel: 'Chỉnh sửa: {{label}}',
    email: 'Email',
    emailAddress: 'Địa chỉ Email',
    enterAValue: 'Nhập một giá trị',
    error: 'Lỗi',
    errors: 'Lỗi',
    exitLivePreview: 'Thoát Xem trực tiếp',
    export: 'Xuất khẩu',
    fallbackToDefaultLocale: 'Ngôn ngữ mặc định',
    false: 'Sai',
    filter: 'Lọc',
    filters: 'Bộ lọc',
    filterWhere: 'Lọc {{label}} với điều kiện:',
    globals: 'Toàn thể (globals)',
    goBack: 'Quay lại',
    groupByLabel: 'Nhóm theo {{label}}',
    import: 'Nhập khẩu',
    isEditing: 'đang chỉnh sửa',
    item: 'mặt hàng',
    items: 'mặt hàng',
    language: 'Ngôn ngữ',
    lastModified: 'Chỉnh sửa lần cuối vào lúc',
    leaveAnyway: 'Tiếp tục thoát',
    leaveWithoutSaving: 'Thay đổi chưa được lưu',
    light: 'Nền sáng',
    livePreview: 'Xem trước',
    loading: 'Đang tải',
    locale: 'Ngôn ngữ',
    locales: 'Khu vực',
    menu: 'Thực đơn',
    moreOptions: 'Nhiều lựa chọn hơn',
    move: 'Di chuyển',
    moveConfirm:
      'Bạn sắp chuyển {{count}} {{label}} đến <1>{{destination}}</1>. Bạn có chắc chắn không?',
    moveCount: 'Di chuyển {{count}} {{label}}',
    moveDown: 'Di chuyển xuống',
    moveUp: 'Di chuyển lên',
    moving: 'Di chuyển',
    movingCount: 'Di chuyển {{count}} {{label}}',
    newPassword: 'Mật khảu mới',
    next: 'Tiếp theo',
    no: 'Không',
    noDateSelected: 'Không có ngày nào được chọn',
    noFiltersSet: 'Không có bộ lọc nào được áp dụng',
    noLabel: '<Không có {{label}}>',
    none: 'Không có',
    noOptions: 'Không có lựa chọn',
    noResults:
      'Danh sách rỗng: {{label}}. Có thể {{label}} chưa tồn tại hoặc không có dữ kiện trùng với bộ lọc hiện tại.',
    notFound: 'Không tìm thấy',
    nothingFound: 'Không tìm thấy',
    noUpcomingEventsScheduled: 'Không có sự kiện sắp tới được lên lịch.',
    noValue: 'Không có giá trị',
    of: 'trong số',
    only: 'Chỉ',
    open: 'Mở',
    or: 'hoặc',
    order: 'Thứ tự',
    overwriteExistingData: 'Ghi đè dữ liệu trường hiện tại',
    pageNotFound: 'Không tìm thấy trang',
    password: 'Mật khẩu',
    pasteField: 'Dán trường',
    pasteRow: 'Dán dòng',
    payloadSettings: 'Cài đặt',
    perPage: 'Hiển thị mỗi trang: {{limit}}',
    previous: 'Trước đó',
    reindex: 'Tái lập chỉ mục',
    reindexingAll: 'Đang tái lập chỉ mục tất cả {{collections}}.',
    remove: 'Loại bỏ',
    rename: 'Đổi tên',
    reset: 'Đặt lại',
    resetPreferences: 'Đặt lại sở thích',
    resetPreferencesDescription: 'Điều này sẽ đặt lại tất cả sở thích của bạn về cài đặt mặc định.',
    resettingPreferences: 'Đang đặt lại sở thích.',
    row: 'Hàng',
    rows: 'Những hàng',
    save: 'Luu',
    saving: 'Đang lưu...',
    schedulePublishFor: 'Lên lịch xuất bản cho {{title}}',
    searchBy: 'Tìm với {{label}}',
    select: 'Chọn',
    selectAll: 'Chọn tất cả {{count}} {{label}}',
    selectAllRows: 'Chọn tất cả các hàng',
    selectedCount: 'Đã chọn {{count}} {{label}}',
    selectLabel: 'Chọn {{label}}',
    selectValue: 'Chọn một giá trị',
    showAllLabel: 'Hiển thị tất cả {{label}}',
    sorryNotFound: 'Xin lỗi, không có kết quả nào tương ứng với request của bạn.',
    sort: 'Sắp xếp',
    sortByLabelDirection: 'Sắp xếp theo {{label}} {{direction}}',
    stayOnThisPage: 'Ở lại trang này',
    submissionSuccessful: 'Gửi thành công.',
    submit: 'Gửi',
    submitting: 'Đang gửi...',
    success: 'Thành công',
    successfullyCreated: '{{label}} đã được tạo thành công.',
    successfullyDuplicated: '{{label}} đã được sao chép thành công.',
    successfullyReindexed:
      'Tái lập chỉ mục thành công {{count}} trong tổng số {{total}} tài liệu từ {{collections}} bộ sưu tập.',
    takeOver: 'Tiếp quản',
    thisLanguage: 'Vietnamese (Tiếng Việt)',
    time: 'Thời gian',
    timezone: 'Múi giờ',
    titleDeleted: '{{label}} {{title}} đã được xóa thành công.',
    true: 'Thật',
    unauthorized: 'Không có quyền truy cập.',
    unsavedChanges: 'Bạn có những thay đổi chưa được lưu. Lưu hoặc hủy trước khi tiếp tục.',
    unsavedChangesDuplicate: 'Bạn chưa lưu các thay đổi. Bạn có muốn tiếp tục tạo bản sao?',
    untitled: 'Chưa có tiêu đề',
    upcomingEvents: 'Sự kiện sắp tới',
    updatedAt: 'Ngày cập nhật',
    updatedCountSuccessfully: 'Đã cập nhật thành công {{count}} {{label}}.',
    updatedLabelSuccessfully: 'Đã cập nhật {{label}} thành công.',
    updatedSuccessfully: 'Cập nhật thành công.',
    updateForEveryone: 'Cập nhật cho mọi người',
    updating: 'Đang cập nhật',
    uploading: 'Đang tải lên',
    uploadingBulk: 'Đang tải lên {{current}} trong tổng số {{total}}',
    user: 'Người dùng',
    username: 'Tên đăng nhập',
    users: 'Người dùng',
    value: 'Giá trị',
    viewReadOnly: 'Xem chỉ đọc',
    welcome: 'Xin chào',
    yes: 'Đúng',
  },
  localization: {
    cannotCopySameLocale: 'Không thể sao chép vào cùng một vị trí',
    copyFrom: 'Sao chép từ',
    copyFromTo: 'Sao chép từ {{from}} đến {{to}}',
    copyTo: 'Sao chép đến',
    copyToLocale: 'Sao chép vào địa phương',
    localeToPublish: 'Ngôn ngữ để xuất bản',
    selectLocaleToCopy: 'Chọn địa phương để sao chép',
  },
  operators: {
    contains: 'có chứa',
    equals: 'bằng',
    exists: 'tồn tại',
    intersects: 'giao nhau',
    isGreaterThan: 'lớn hơn',
    isGreaterThanOrEqualTo: 'lớn hơn hoặc bằng',
    isIn: 'có trong',
    isLessThan: 'nhỏ hơn',
    isLessThanOrEqualTo: 'nhỏ hơn hoặc bằng',
    isLike: 'gần giống',
    isNotEqualTo: 'không bằng',
    isNotIn: 'không có trong',
    isNotLike: 'không giống như',
    near: 'gần',
    within: 'trong',
  },
  upload: {
    addFile: 'Thêm tập tin',
    addFiles: 'Thêm tệp',
    bulkUpload: 'Tải lên số lượng lớn',
    crop: 'Mùa vụ',
    cropToolDescription:
      'Kéo các góc của khu vực đã chọn, vẽ một khu vực mới hoặc điều chỉnh các giá trị dưới đây.',
    download: 'Tải xuống',
    dragAndDrop: 'Kéo và thả một tập tin',
    dragAndDropHere: 'hoặc kéo và thả file vào đây',
    editImage: 'Chỉnh sửa hình ảnh',
    fileName: 'Tên file',
    fileSize: 'Dung lượng file',
    filesToUpload: 'Tệp để Tải lên',
    fileToUpload: 'Tệp để Tải lên',
    focalPoint: 'Điểm trọng tâm',
    focalPointDescription:
      'Kéo điểm tiêu cực trực tiếp trên trình xem trước hoặc điều chỉnh các giá trị bên dưới.',
    height: 'Chiều cao',
    lessInfo: 'Hiển thị ít hơn',
    moreInfo: 'Thêm',
    noFile: 'Không có tệp',
    pasteURL: 'Dán URL',
    previewSizes: 'Kích cỡ xem trước',
    selectCollectionToBrowse: 'Chọn một Collection để tìm',
    selectFile: 'Chọn một file',
    setCropArea: 'Đặt khu vực cắt',
    setFocalPoint: 'Đặt điểm tiêu điểm',
    sizes: 'Các độ phân giải',
    sizesFor: 'Kích thước cho {{label}}',
    width: 'Chiều rộng',
  },
  validation: {
    emailAddress: 'Địa chỉ email không hợp lệ.',
    enterNumber: 'Vui lòng nhập số.',
    fieldHasNo: 'Field này không có: {{label}}',
    greaterThanMax: '{{value}} lớn hơn giá trị tối đa cho phép của {{label}} là {{max}}.',
    invalidInput: 'Dữ liệu nhập vào không hợp lệ.',
    invalidSelection: 'Lựa chọn ở field này không hợp lệ.',
    invalidSelections: "'Field này có những lựa chọn không hợp lệ sau:'",
    lessThanMin: '{{value}} nhỏ hơn giá trị tối thiểu cho phép của {{label}} là {{min}}.',
    limitReached: 'Đã đạt giới hạn, chỉ có thể thêm {{max}} mục.',
    longerThanMin: 'Giá trị này cần có độ dài tối thiểu {{minLength}} ký tự.',
    notValidDate: '"{{value}}" không phải là một ngày (date) hợp lệ.',
    required: 'Field này cần được diền.',
    requiresAtLeast: 'Field này cần tối thiểu {{count}} {{label}}.',
    requiresNoMoreThan: 'Field này không thể vượt quá {{count}} {{label}}.',
    requiresTwoNumbers: 'Field này cần tối thiểu 2 chữ số.',
    shorterThanMax: 'Giá trị phải ngắn hơn hoặc bằng {{maxLength}} ký tự.',
    timezoneRequired: 'Yêu cầu phải có múi giờ.',
    trueOrFalse: 'Field này chỉ có thể chứa giá trị true hoặc false.',
    username:
      'Vui lòng nhập một tên người dùng hợp lệ. Có thể chứa các chữ cái, số, dấu gạch ngang, dấu chấm và dấu gạch dưới.',
    validUploadID: "'Field này không chứa ID tải lên hợp lệ.'",
  },
  version: {
    type: 'Loại',
    aboutToPublishSelection: 'Bạn có muốn xuất bản tất cả {{label}} không?',
    aboutToRestore: 'Bạn chuẩn bị khôi phục lại {{label}} về phiên bản {{versionDate}}.',
    aboutToRestoreGlobal:
      'Bạn chuẩn bị khôi phục lại bản toàn thể (global) của {{label}} về phiên bản {{versionDate}}.',
    aboutToRevertToPublished: 'Bạn có muốn tái xuất bản bản nháp này không?',
    aboutToUnpublish: 'Bạn có muốn ngưng xuất bản?',
    aboutToUnpublishSelection: 'Bạn có muốn ngưng xuất bản tất cả {{label}} không?',
    autosave: 'Tự động lưu dữ liệu',
    autosavedSuccessfully: 'Đã tự động lưu thành công.',
    autosavedVersion: 'Các phiên bản từ việc tự động lưu dữ liệu',
    changed: 'Đã thay đổi',
    changedFieldsCount_one: '{{count}} đã thay đổi trường',
    changedFieldsCount_other: '{{count}} trường đã thay đổi',
    compareVersion: 'So sánh phiên bản này với:',
    compareVersions: 'So sánh các phiên bản',
    comparingAgainst: 'So sánh với',
    confirmPublish: 'Xác nhận xuất bản',
    confirmRevertToSaved: 'Xác nhận, quay về trạng thái đã lưu',
    confirmUnpublish: 'Xác nhận, ngưng xuất bản',
    confirmVersionRestoration: 'Xác nhận, khôi phục về phiên bản trước',
    currentDocumentStatus: 'Trạng thái tài liệu hiện tại: {{docStatus}}',
    currentDraft: 'Bản thảo hiện tại',
    currentlyPublished: 'Hiện đã xuất bản',
    currentlyViewing: 'Đang xem',
    currentPublishedVersion: 'Phiên bản Đã Xuất bản Hiện tại',
    draft: 'Bản nháp',
    draftSavedSuccessfully: 'Bản nháp đã được lưu thành công.',
    lastSavedAgo: 'Lần lưu cuối cùng {{distance}} trước đây',
    modifiedOnly: 'Chỉ được sửa đổi',
    moreVersions: 'Thêm phiên bản...',
    noFurtherVersionsFound: 'Không tìm thấy phiên bản cũ hơn',
    noRowsFound: 'Không tìm thấy: {{label}}',
    noRowsSelected: 'Không có {{label}} được chọn',
    preview: 'Bản xem trước',
    previouslyPublished: 'Đã xuất bản trước đây',
    previousVersion: 'Phiên bản Trước',
    problemRestoringVersion: 'Đã xảy ra vấn đề khi khôi phục phiên bản này',
    publish: 'Công bố',
    publishAllLocales: 'Xuất bản tất cả địa phương',
    publishChanges: 'Xuất bản tài liệu',
    published: 'Đã xuất bản',
    publishIn: 'Xuất bản trong {{locale}}',
    publishing: 'Xuất bản',
    restoreAsDraft: 'Khôi phục như bản nháp',
    restoredSuccessfully: 'Đã khôi phục thành công.',
    restoreThisVersion: 'Khôi phục về phiên bản này',
    restoring: 'Đang khôi phục...',
    reverting: 'Đang về trạng thái cũ...',
    revertToPublished: 'Quay về trạng thái đã xuất bản',
    saveDraft: 'Lưu bản nháp',
    scheduledSuccessfully: 'Đã lên lịch thành công.',
    schedulePublish: 'Lịch xuất bản',
    selectLocales: 'Chọn mã khu vực để hiện thị',
    selectVersionToCompare: 'Chọn phiên bản để so sánh',
    showingVersionsFor: 'Hiển thị các phiên bản cho:',
    showLocales: 'Hiển thị mã khu vực:',
    specificVersion: 'Phiên bản cụ thể',
    status: 'Trạng thái',
    unpublish: 'Ẩn tài liệu',
    unpublishing: 'Đang ẩn tài liệu...',
    version: 'Phiên bản',
    versionAgo: '{{distance}} trước',
    versionCount_many: '{{count}} phiên bản được tìm thấy',
    versionCount_none: 'Không có phiên bản nào được tìm thấy',
    versionCount_one: '{{count}} phiên bản được tìm thấy',
    versionCount_other: 'Đã tìm thấy {{count}} phiên bản',
    versionCreatedOn: 'Phiên bản {{version}} được tạo vào lúc:',
    versionID: 'ID của phiên bản',
    versions: 'Danh sách phiên bản',
    viewingVersion: 'Xem phiên bản của {{entityLabel}} {{documentTitle}}',
    viewingVersionGlobal: '`Xem phiên bản toàn thể (global) của {{entityLabel}}',
    viewingVersions: 'Xem những phiên bản của {{entityLabel}} {{documentTitle}}',
    viewingVersionsGlobal: '`Xem những phiên bản toàn thể (global) của {{entityLabel}}',
  },
}

export const vi: Language = {
  dateFNSKey: 'vi',
  translations: viTranslations,
}
