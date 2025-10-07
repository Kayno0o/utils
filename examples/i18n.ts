import type { TranslationObject, TranslationStructure } from '../src/builders'
import { declareI18n } from '../src/builders'

const fr = {
  commands: {
    help: {
      description: 'Affiche l\'aide',
      response: 'Voici l\'aide pour {command}',
    },
    user: {
      profile: 'Profil de {username}',
      notFound: 'Utilisateur introuvable',
      joined: 'A rejoint le {date}',
    },
    ping: {
      response: 'Pong! Latence: {latency}ms',
    },
  },
  errors: {
    generic: 'Une erreur s\'est produite',
    forbidden: 'Vous n\'avez pas la permission',
    cooldown: 'Veuillez attendre {seconds} secondes',
  },
  common: {
    yes: 'Oui',
    no: 'Non',
    cancel: 'Annuler',
  },
  missing_in_en: '',
} as const satisfies TranslationObject

/** @ts-expect-error "missing_in_en" key is not in `EN` translations */
const en: TranslationStructure<typeof fr> = {
  commands: {
    help: {
      description: 'Show help',
      response: 'Here is help for {command}',
    },
    user: {
      profile: 'Profile of {username}',
      notFound: 'User not found',
      joined: 'Joined on {date}',
    },
    ping: {
      response: 'Pong! Latency: {latency}ms',
    },
  },
  errors: {
    generic: 'An error occurred',
    forbidden: 'You don\'t have permission',
    cooldown: 'Please wait {seconds} seconds',
  },
  common: {
    yes: 'Yes',
    no: 'No',
    cancel: 'Cancel',
  },
} as const

const translations = { fr, en } as const

const { t } = declareI18n(translations)

t('en', 'commands.help.description')
t('en', 'commands.help.response', { command: 'wiwiwi' })

// ! TypeScript will error on these:
/** @ts-expect-error Expected 3 arguments */
t('fr', 'commands.user.profile')
/** @ts-expect-error Expected 2 arguments */
t('fr', 'commands.user.notFound', { foo: 'bar' })
/** @ts-expect-error 'wrongVar' not in variables */
t('fr', 'commands.user.profile', { wrongVar: 'test' })
/** @ts-expect-error invalid key */
t('fr', 'invalid.key')
/** @ts-expect-error invalid locale */
t('es', 'invalid.key')
