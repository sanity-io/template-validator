export {validateLocalTemplate} from './local'
export {validateRemoteTemplate} from './remote'
export {
  ENV_FILE,
  ENV_TEMPLATE_FILES,
  REQUIRED_ENV_VAR_STUDIO as REQUIRED_ENV_VAR,
  REQUIRED_ENV_VAR_APP,
} from './utils/constants'
export {type FileReader, GitHubFileReader, LocalFileReader} from './utils/fileReader'
export type {ValidationResult} from './utils/types'
export {getMonoRepo, validateTemplate} from './utils/validator'
