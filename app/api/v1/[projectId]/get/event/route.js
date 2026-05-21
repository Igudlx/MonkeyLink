
export const runtime = 'nodejs';
import { getProjectData, saveProjectData, jsonResponse, unauthorized, isAuthorized } from '../../../../../../lib';


export async function GET(req, context) {
  if (!isAuthorized(req)) return unauthorized();
  const { projectId } = await context.params;
  const data = getProjectData(projectId);
  const payload = data.event || '';
  data.event = '';
  saveProjectData(projectId, data);
  return jsonResponse({ success: true, type: 'event', payload });
}
