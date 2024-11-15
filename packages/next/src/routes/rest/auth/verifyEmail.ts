import httpStatus from 'http-status'
import { verifyEmailOperation } from 'payload'

import type { CollectionRouteHandlerWithID } from '../types.js'

import { headersWithCors } from '../../../utilities/headersWithCors.js'

export const verifyEmail: CollectionRouteHandlerWithID = async ({ id, collection, req }) => {
  const { t } = req
  await verifyEmailOperation({
    collection,
    req,
    token: id,
  })

  return Response.json(
    {
      message: t('authentication:accountVerified'),
    },
    {
      headers: headersWithCors({
        headers: new Headers(),
        req,
      }),
      status: httpStatus.OK,
    },
  )
}
